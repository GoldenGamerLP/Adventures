import { ObjectId } from "mongodb";
import { DEFAULT_MAX_SEARCH_RADIUS_KM } from "~~/shared/constants/Constants";
import type { AdventuresQueryFilterType } from "~~/shared/schema/AdventuresSchema";
import type { Adventure, AdventureWithMeta } from "~~/shared/types/AdventureTypes";
import type { AdventureDraft } from "~~/shared/types/DraftTypes";
import type { UserSummary } from "~~/shared/types/UserProfileTypes";
import { getCollection } from "../database/DBUtils";
import { getViewCounter } from "./ViewsUtils";

const getAdventureDB = async () => getCollection<Adventure>('adventures');

export const ensureAdventureIndexes = async (): Promise<void> => {
    //Index für schnelle Abfragen nach DraftId
    const adventureDB = await getAdventureDB();

    await Promise.all([
        adventureDB.createIndex({ 'location.coordinates': '2dsphere' }),
        adventureDB.createIndex({ 'title': 'text' }),
        adventureDB.createIndex({ visibility: 1 }),
        adventureDB.createIndex({ createdAt: -1 }),
    ]);

    console.log('[AdventureUtils] Adventure indexes created');
}


const createAdventure = async (adventure: Omit<Adventure, '_id' | 'createdAt' | 'updatedAt'>): Promise<Adventure> => {
    //Erstelle neues Adventure-Dokument oder Aktualisiere ein bestehendes
    const adventureDB = await getAdventureDB();

    const foundAdventure = await adventureDB.findOne({ draftId: adventure.draftId });

    if (foundAdventure) {
        return await updateAdventure(foundAdventure._id, adventure) as Adventure;
    }

    const now = new Date();
    const newAdventure: Adventure = {
        _id: new ObjectId().toString(),
        ...adventure,
        createdAt: now,
        updatedAt: now,
    };
    await adventureDB.insertOne(newAdventure);
    return newAdventure;
}

const getAdventureById = async (id: string): Promise<Adventure | null> => {
    const adventureDB = await getAdventureDB();

    return await adventureDB.findOne({ _id: id });
}

const validateAdventureOwnership = async (adventureId: string, userId: string): Promise<boolean> => {
    const adventureDB = await getAdventureDB();
    const adventure = await adventureDB.findOne({ _id: adventureId, authorId: userId });
    return !!adventure;
}

const updateAdventure = async (id: string, updates: Partial<Omit<Adventure, '_id' | 'createdAt' | 'authorId'>>): Promise<Adventure | null> => {
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
    return await adventureDB.find().toArray();
}

const publishFromDraft = async (draft: AdventureDraft): Promise<Adventure> => {
    return await createAdventure({
        title: draft.formData.title!,
        description: draft.formData.description!,
        location: draft.formData.location,
        schedule: draft.formData.schedule,
        difficulty: draft.formData.difficulty!,
        category: draft.formData.category!,
        pictureIds: draft.pictureIds,
        tags: draft.formData.tags || [],
        authorId: draft.authorId,
        draftId: draft._id,
        visibility: draft.formData.visibility!,
    });
}

const getAdventuresByFilterAndUser = async (user: UserSummary | null, filter: AdventuresQueryFilterType, limit = 25): Promise<AdventureWithMeta[]> => {
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
                    path: "$playlistsIds"
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
        $lookup: {
            from: 'users',
            localField: 'authorId',
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
        $unwind: '$author'
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

    const response = await adventureDB.aggregate<AdventureWithMeta>(query).limit(limit).toArray();
    return Promise.all(response.map(enrichAdventureWithViews));
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
    const query: any[] = [
        {
            $match: {
                _id: id,
            }
        },
        {
            $match: {
                $or: [
                    { visibility: { $in: ['public', 'unlisted'] } },
                    { authorId: user?._id }
                ]
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'authorId',
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
        { $unwind: '$author' },
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
        { $match: { authorId, ...(visibility && visibility !== 'all' ? { visibility } : {}) } },
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
                localField: 'authorId',
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

export {
    createAdventure,
    getAdventureById, getAdventureByIdWithMeta, getAdventuresByAuthor, getAdventuresByFilterAndUser, getAllAdventures, publishFromDraft, updateAdventure, validateAdventureOwnership
};

