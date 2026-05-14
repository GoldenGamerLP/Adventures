import { ObjectId } from "mongodb";
import { DEFAULT_MAX_SEARCH_RADIUS_KM } from "~~/shared/constants/Constants";
import type { AdventuresQueryFilterType, SimilarAdventuresFilterType } from "~~/shared/schema/AdventuresSchema";
import type { Adventure, AdventureCategory, AdventureWithMeta } from "~~/shared/types/AdventureTypes";
import type { AdventureDraft } from "~~/shared/types/DraftTypes";
import type { UserSummary } from "~~/shared/types/UserProfileTypes";
import { getCollection } from "../database/DBUtils";
import { getViewCounter } from "./ViewsUtils";

const getAdventureDB = async () => getCollection<Adventure>('adventures');

const normalizeSchedule = (schedule: AdventureDraft['formData']['schedule']): Adventure['schedule'] => ({
    type: schedule.type,
    estimatedDuration: schedule.estimatedDuration,
    isApproximate: schedule.isApproximate,
    repeatsAnnually: schedule.repeatsAnnually,
    slots: schedule.slots,
    startDate: schedule.startDate ? schedule.startDate.toISOString() : undefined,
    endDate: schedule.endDate ? schedule.endDate.toISOString() : undefined,
});

export const ensureAdventureIndexes = async (): Promise<void> => {
    //Index für schnelle Abfragen nach DraftId
    const adventureDB = await getAdventureDB();

    await Promise.all([
        adventureDB.createIndex({ 'location.coordinates': '2dsphere' }),
        adventureDB.createIndex({ 'title': 'text' }),
        adventureDB.createIndex({ visibility: 1 }),
        adventureDB.createIndex({ createdAt: -1 }),
        adventureDB.createIndex({ 'source.userId': 1 }),
        adventureDB.createIndex({ 'source.review.reviewerId': 1 }),
    ]);

    console.log('[AdventureUtils] Adventure indexes created');
}

/**
 * 
 * Erstellt ein Adventure basierend auf den übergebenen Daten. Wenn eine ID übergeben wird, wird versucht ein bestehendes Adventure mit dieser ID zu aktualisieren (z.B. bei Veröffentlichung eines Drafts), ansonsten wird ein neues Adventure erstellt.
 * 
 * @param adventure Daten eines Adventures, ohne _id und updatedAt (da diese Felder automatisch generiert bzw. aktualisiert werden)
 * @param id Optional: Wenn eine ID übergeben wird, wird versucht ein bestehendes Adventure mit dieser ID zu aktualisieren, ansonsten wird ein neues Adventure erstellt. Dies ist vor allem für die Veröffentlichung von Drafts relevant, damit die Draft-ID als Referenz im Adventure gespeichert werden kann.
 * @returns Das erstellte oder aktualisierte Adventure mit generierter ID und aktualisiertem Timestamp
 */
export const createAdventure = async (adventure: Omit<Adventure, '_id' | 'updatedAt'>, id?: string): Promise<Adventure> => {
    //Erstelle neues Adventure-Dokument oder Aktualisiere ein bestehendes
    const adventureDB = await getAdventureDB();

    const foundAdventure = await adventureDB.findOne({ _id: id }) as Adventure | null;

    if (foundAdventure) {
        //Wenn Adventure mit der ID bereits existiert, aktualisiere es mit den neuen Daten (z.B. bei Veröffentlichung eines Drafts)
        return await updateAdventure(id!, adventure) as Adventure;
    }

    const now = new Date();
    const newAdventure: Adventure = {
        _id: id || new ObjectId().toString(),
        ...adventure,
        createdAt: adventure.createdAt || now,
        updatedAt: now,
    };
    await adventureDB.insertOne(newAdventure);
    return newAdventure;
}

const getAdventureById = async (id: string): Promise<Adventure | null> => {
    const adventureDB = await getAdventureDB();

    return await adventureDB.findOne({ _id: id }) as Adventure | null;
}

const validateAdventureOwnership = async (adventureId: string, userId: string): Promise<boolean> => {
    const adventureDB = await getAdventureDB();
    const adventure = await adventureDB.findOne({
        _id: adventureId,
        $or: [
            { 'source.userId': userId },
            { 'source.review.reviewerId': userId },
        ],
    });
    return !!adventure;
}

const updateAdventure = async (id: string, updates: Partial<Omit<Adventure, '_id' | 'createdAt'>>): Promise<Adventure | null> => {
    const adventureDB = await getAdventureDB();
    const now = new Date();
    const result = await adventureDB.findOneAndUpdate(
        { _id: id },
        { $set: { ...updates, updatedAt: now } },
        { returnDocument: 'after' }
    );
    return result as Adventure | null;
}

const getAllAdventures = async (): Promise<Adventure[]> => {
    const adventureDB = await getAdventureDB();
    return await adventureDB.find().toArray() as Adventure[];
}

const publishFromDraft = async (draft: AdventureDraft): Promise<Adventure> => {
    return await createAdventure({
        title: draft.formData.title!,
        description: draft.formData.description!,
        location: draft.formData.location,
        schedule: normalizeSchedule(draft.formData.schedule),
        difficulty: draft.formData.difficulty!,
        category: draft.formData.category! as AdventureCategory,
        pictureIds: draft.pictureIds,
        tags: (draft.formData.tags || []) as Adventure['tags'],
        visibility: draft.formData.visibility!,
        createdAt: new Date(),
        source: {
            provider: 'user',
            userId: draft.authorId,
        },
    }, draft._id);
}

const findSimilarAdventures = async (filter: SimilarAdventuresFilterType): Promise<AdventureWithMeta[]> => {
    const adventureDB = await getAdventureDB();
    const radiusInMeters = (filter.radius || DEFAULT_MAX_SEARCH_RADIUS_KM) * 1000;

    const query: any[] = [
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [filter.location[0], filter.location[1]],
                },
                distanceField: "location.distance",
                maxDistance: radiusInMeters,
                spherical: true,
                query: {
                    _id: { $ne: filter.adventureId },
                    'location.coordinates': { $exists: true },
                    visibility: 'public',
                }
            }
        },
        {
            $match: {
                visibility: 'public',
            }
        },
        {
            $lookup: {
                from: 'adventure_likes',
                let: { adventureId: '$_id' },
                pipeline: [
                    //group and sum
                    { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }] } } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ],
                as: 'likes'
            }
        },
        {
            $addFields: {
                likesCount: { $cond: { if: { $isArray: "$likes" }, then: { $arrayElemAt: ["$likes.count", 0] }, else: 0 } }
            }
        },
        {
            $sort: {
                likesCount: -1,
                createdAt: -1,
                "location.distance": 1,
            }
        },
        {
            $limit: filter.limit || 5,
        }
    ];

    const response = adventureDB.aggregate<AdventureWithMeta>(query);

    const results = await response.toArray();
    return Promise.all(results.map(enrichAdventureWithViews));
}

const getAdventuresByFilterAndUser = async (user: UserSummary | null, filter: Omit<AdventuresQueryFilterType, 'limit' | 'pageParam'>, limit = 25, pageParam = 0): Promise<AdventureWithMeta[]> => {
    const adventureDB = await getAdventureDB();
    const query: any = [];

    const radiusInMeters = (filter.radius || DEFAULT_MAX_SEARCH_RADIUS_KM) * 1000;
    //GeoNear aggregation first stage
    query.push({
        $geoNear: {
            near: {
                type: "Point",
                coordinates: [filter.location[0], filter.location[1]],
            },
            distanceField: "location.distance",
            maxDistance: radiusInMeters,
            spherical: true,
            query: {
                'location.coordinates': { $exists: true },
                'visibility': 'public', // Nur öffentliche Abenteuer in Geo-Abfrage einbeziehen
                ...(filter.query && { $text: { $search: filter.query } })
            }
        }
    });

    query.push({
        $match: {
            visibility: 'public', // Nur öffentliche Abenteuer zurückgeben
        }
    });

    if (user) {
        //lookup für likes des eingeloggten Users, damit wir in der Antwort direkt mitliefern können ob der User das Adventure geliked hat
        query.push({
            $lookup: {
                from: 'adventure_likes',
                let: { adventureId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }, { $eq: ['$userId', user._id] }] } } }
                ],
                as: 'userLikes'
            }
        });

        //Fügt eine liste namens "foundAdventureLists" hinzu, die alle AdventureListIds enthält, in denen das Adventure enthalten ist, basierend auf den AdventureLists des eingeloggten Users
        query.push(

            {
                $lookup:
                {
                    from: "adventure_lists",
                    pipeline: [
                        {
                            $match: {
                                ownerId: user._id
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                ids: {
                                    $addToSet: "$_id"
                                }
                            }
                        }
                    ],
                    as: "playlistsIds"
                }
            },
            {
                $unwind:
                {
                    path: "$playlistsIds",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $set:
                {
                    playlistsIds: {
                        $ifNull: ["$playlistsIds.ids", []]
                    }

                }
            },
            {
                $lookup:

                {
                    from: "adventure_list_entries",
                    let: {
                        adventureId: "$_id",
                        pids: "$playlistsIds"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $in: [
                                                "$adventureListId",
                                                "$$pids"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$adventureId",
                                                "$$adventureId"
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                lists: {
                                    $addToSet: "$adventureListId"
                                }
                            }
                        }
                    ],
                    as: "playlistsIds"
                }
            },
            {
                $unwind:
                {
                    path: "$playlistsIds",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $set:
                {
                    adventureListIds: {
                        $ifNull: ["$playlistsIds.lists", []]
                    }
                }
            },
        );
    }

    //Feld "isLikedByUser" basierend auf der Anzahl der gefundenen Likes setzen
    //Auch setzen wenn kein User eingeloggt ist, damit das Frontend nicht extra prüfen muss ob das Feld existiert
    query.push({
        $addFields: {
            isLikedByUser: { $cond: { if: { $isArray: "$userLikes" }, then: { $gt: [{ $size: "$userLikes" }, 0] }, else: false } }
        }
    });

    query.push({
        $lookup: {
            from: 'adventure_likes',
            let: { adventureId: '$_id' },
            pipeline: [
                //group and sum
                { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }] } } },
                { $group: { _id: null, count: { $sum: 1 } } }
            ],
            as: 'likes'
        }
    })

    query.push({
        $addFields: {
            likesCount: { $cond: { if: { $isArray: "$likes" }, then: { $arrayElemAt: ["$likes.count", 0] }, else: 0 } }
        }
    });

    //GeoQuery must be first stage, second stage author lookup
    query.push({
        $set: {
            ownerUserId: {
                $cond: [
                    { $eq: ['$source.provider', 'user'] },
                    '$source.userId',
                    '$source.review.reviewerId',
                ],
            },
        },
    });

    query.push({
        $lookup: {
            from: 'users',
            localField: 'ownerUserId',
            foreignField: '_id',
            as: 'author',
            pipeline: [
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        profilePictureId: 1,
                    }
                }
            ]
        }
    });


    query.push({
        $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true,
        }
    });

    query.push({
        $lookup: {
            from: 'adventure_view_counters',
            localField: '_id',
            foreignField: 'adventureId',
            as: 'viewCounter'
        }
    });

    query.push({
        $addFields: {
            viewCount: {
                $ifNull: [{ $arrayElemAt: ["$viewCounter", 0] }, { totalViews: 0, uniqueUsers: 0, uniqueGuests: 0 }]
            }
        }
    });

    //Duration filter
    if (filter.duration) {
        const [min, max] = filter.duration;
        query.push({
            $match: {
                duration: {
                    $gte: min,
                    $lte: max,
                }
            }
        });
    }

    //Difficulty filter
    if (filter.difficulty) {
        query.push({
            $match: {
                difficulty: filter.difficulty
            }
        });
    }

    //Category/Tags filter
    if (filter.category && filter.category.length > 0) {
        query.push({
            $match: {
                category: { $in: [filter.category] }
            }
        });
    }


    if (filter.tags) {
        const tags = filter.tags;
        query.push({
            $match: {
                tags: { $all: [...tags] }
            }
        });
    }

    if (filter.sort) {
        //Sortierung: "popular"
        //Wichtung auf Basis von:
        //1. Anzahl Views
        //2. Aktualität (createdAt)
        if (filter.sort === 'popular') {
            query.push({
                $lookup: {
                    from: 'adventure_views',
                    localField: '_id',
                    foreignField: 'adventureId',
                    as: 'views'
                }
            });

            query.push({
                $addFields: {
                    viewCount: { $sum: '$views.viewCount' }
                }
            });

            query.push({
                $sort: {
                    viewCount: -1,
                    createdAt: -1,
                }
            });
        }

        //Sortierung: "new" - einfach nach Erstellungsdatum sortieren
        if (filter.sort === 'new') {
            query.push({
                $sort: {
                    createdAt: -1,
                }
            });
        }

        //Sortierung: "recommend"
        //Wichtung auf Basis von:
        //1. Anzahl Likes
        //2. Aktualität (createdAt)
        //3. Entfernung zum User (location.distance)
        //4. Anzahl Views
        //Ähnlich wie "popular", aber mit zusätzlicher Gewichtung für Entfernung und Views, damit nicht nur die beliebtesten Abenteuer ganz oben landen, sondern auch neuere und näher gelegene Abenteuer eine Chance haben
        if (filter.sort === 'recommended') {
            query.push({
                $lookup: {
                    from: 'adventure_likes',
                    localField: '_id',
                    foreignField: 'adventureId',
                    as: 'likes'
                }
            });

            query.push({
                $addFields: {
                    likeCount: { $sum: '$likes' }
                }
            });

            //Sort:
            //1. nach likeCount
            //2. nach createdAt (neuere Abenteuer zuerst)
            //3. nach Entfernung (näher zuerst)
            //4. nach viewCount (beliebtere Abenteuer zuerst)
            query.push({
                $sort: {
                    likeCount: -1,
                    createdAt: -1,
                    "location.distance": 1,
                    "viewCount": -1,
                }
            });
        }

        if (filter.sort === 'near_me') {
            query.push({
                $sort: {
                    'location.distance': 1,
                    createdAt: -1,
                }
            });
        }
    }

    const response = adventureDB
        .aggregate<AdventureWithMeta>(query)
        .skip(pageParam * limit)
        .limit(limit);
    const results = await response.toArray();
    return Promise.all(results.map(enrichAdventureWithViews));
}

const enrichAdventureWithViews = async (adventure: AdventureWithMeta): Promise<AdventureWithMeta> => {
    const viewCount = await getViewCounter(adventure._id);
    return {
        ...adventure,
        viewCount,
    };
}

const getAdventureByIdWithMeta = async (id: string, user?: UserSummary): Promise<AdventureWithMeta | null> => {
    const adventureDB = await getAdventureDB();
    const visibilityOrOwnerClauses: any[] = [{ visibility: { $in: ['public', 'unlisted'] } }];

    if (user?._id) {
        visibilityOrOwnerClauses.push(
            { 'source.userId': user._id },
            { 'source.review.reviewerId': user._id },
        );
    }

    const query: any[] = [
        {
            $match: {
                _id: id,
            }
        },
        {
            $match: {
                $or: visibilityOrOwnerClauses,
            }
        },
        {
            $set: {
                ownerUserId: {
                    $cond: [
                        { $eq: ['$source.provider', 'user'] },
                        '$source.userId',
                        '$source.review.reviewerId',
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'ownerUserId',
                foreignField: '_id',
                as: 'author',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            profilePictureId: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: '$author',
                preserveNullAndEmptyArrays: true,
            },
        },
    ];

    if (user) {
        query.push({
            $lookup: {
                from: 'adventure_likes',
                let: { adventureId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }, { $eq: ['$userId', user._id] }] } } }
                ],
                as: 'userLikes'
            }
        });

        query.push({
            $addFields: {
                isLikedByUser: { $cond: { if: { $isArray: "$userLikes" }, then: { $gt: [{ $size: "$userLikes" }, 0] }, else: false } }
            }
        });

        query.push(
            {
                $lookup:
                {
                    from: "adventure_lists",
                    pipeline: [
                        {
                            $match: {
                                ownerId: user._id
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                ids: {
                                    $addToSet: "$_id"
                                }
                            }
                        }
                    ],
                    as: "playlistsIds"
                }
            },
            {
                $unwind:
                {
                    path: "$playlistsIds",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $set:
                {
                    adventureListsIds: "$playlistsIds.ids"
                }
            },
            {
                $lookup:

                {
                    from: "adventure_list_entries",
                    let: {
                        adventureId: "$_id",
                        pids: "$adventureListsIds"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $in: [
                                                "$adventureListId",
                                                "$$pids"
                                            ]
                                        },
                                        {
                                            $eq: [
                                                "$adventureId",
                                                "$$adventureId"
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                lists: {
                                    $addToSet: "$adventureListId"
                                }
                            }
                        }
                    ],
                    as: "adventureListIds"
                }
            },
            {
                $unwind:
                {
                    path: "$adventureListIds",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $set:
                {
                    adventureListIds:
                        "$adventureListIds.lists"
                }
            },
            {
                $unset:
                    ["adventureListsIds", "playlistsIds"]
            },
            {
                $set: {
                    adventureListIds: {
                        $ifNull: ["$adventureListIds", []]
                    }
                }
            }


        );
    }

    query.push({
        $lookup: {
            from: 'adventure_likes',
            let: { adventureId: '$_id' },
            pipeline: [
                //group and sum
                { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }] } } },
                { $group: { _id: null, count: { $sum: 1 } } }
            ],
            as: 'likes'
        }
    })

    query.push({
        $addFields: {
            likesCount: { $cond: { if: { $isArray: "$likes" }, then: { $arrayElemAt: ["$likes.count", 0] }, else: 0 } }
        }
    });

    const result = await adventureDB.aggregate<AdventureWithMeta>(query).toArray();

    if (result.length === 0) {
        return null;
    }

    return await enrichAdventureWithViews(result[0]!);
}

/**
 * Enthällt keinen Author da die Funktion nur für die Profilseite genutzt wird, wo der Author bereits bekannt ist
 * @param authorId 
 * @param user 
 * @returns 
 */
const getAdventuresByAuthor = async (authorId: string, user?: UserSummary, visibility: 'all' | 'public' | 'unlisted' | 'private' = 'public'): Promise<AdventureWithMeta[]> => {
    const adventureDB = await getAdventureDB();
    const query: any[] = [
        {
            $match: {
                ...(visibility && visibility !== 'all' ? { visibility } : {}),
                $or: [
                    { 'source.userId': authorId },
                    { 'source.review.reviewerId': authorId },
                ],
            },
        },
        {
            $set: {
                ownerUserId: {
                    $cond: [
                        { $eq: ['$source.provider', 'user'] },
                        '$source.userId',
                        '$source.review.reviewerId',
                    ],
                },
            },
        },
    ]

    if (user) {
        query.push({
            $lookup: {
                from: 'adventure_likes',
                let: { adventureId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }, { $eq: ['$userId', user._id] }] } } }
                ],
                as: 'userLikes'
            }
        });

        query.push({
            $lookup: {
                from: 'adventure_likes',
                let: { adventureId: '$_id' },
                pipeline: [
                    //group and sum
                    { $match: { $expr: { $and: [{ $eq: ['$adventureId', '$$adventureId'] }] } } },
                    { $group: { _id: null, count: { $sum: 1 } } }
                ],
                as: 'likes'
            }
        })

        query.push({
            $addFields: {
                likesCount: { $cond: { if: { $isArray: "$likes" }, then: { $arrayElemAt: ["$likes.count", 0] }, else: 0 } }
            }
        });

        query.push({
            $addFields: {
                isLikedByUser: { $cond: { if: { $isArray: "$userLikes" }, then: { $gt: [{ $size: "$userLikes" }, 0] }, else: false } }

            }
        });

        query.push({
            $lookup: {
                from: 'users',
                localField: 'ownerUserId',
                foreignField: '_id',
                as: 'author',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            profilePictureId: 1,
                        }
                    }
                ]
            }
        });

        query.push({ $unwind: '$author' });

        query.push({
            $sort: {
                createdAt: -1,
            }
        });
    }

    const adventures = await adventureDB.aggregate<AdventureWithMeta>(query).toArray();
    return Promise.all(adventures.map(enrichAdventureWithViews));
}

export { findSimilarAdventures, getAdventureById, getAdventureByIdWithMeta, getAdventuresByAuthor, getAdventuresByFilterAndUser, getAllAdventures, publishFromDraft, updateAdventure, validateAdventureOwnership };

