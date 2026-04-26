import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

if (!uri) {
  throw new Error('MONGODB_URI is required');
}

if (!databaseName) {
  throw new Error('MONGODB_DATABASE is required');
}

const client = new MongoClient(uri, {
  retryWrites: true,
  retryReads: true,
});

const migrateSourceTypeToProvider = async (collection) => {
  const result = await collection.updateMany(
    { 'source.type': { $exists: true } },
    [
      { $set: { 'source.provider': '$source.type' } },
      { $unset: 'source.type' },
    ],
  );

  return result.modifiedCount;
};

const removeInvalidUserReview = async (collection) => {
  const result = await collection.updateMany(
    {
      'source.provider': 'user',
      'source.review': { $exists: true },
    },
    {
      $unset: {
        'source.review': '',
      },
    },
  );

  return result.modifiedCount;
};

const normalizeAdventureCollection = async (db) => {
  const collection = db.collection('adventures');

  const providerMigrated = await migrateSourceTypeToProvider(collection);

  const userIdBackfilled = await collection.updateMany(
    {
      'source.provider': 'user',
      'source.userId': { $exists: false },
      authorId: { $exists: true, $type: 'string' },
    },
    [
      {
        $set: {
          'source.userId': '$authorId',
        },
      },
    ],
  );

  const reviewerBackfilled = await collection.updateMany(
    {
      'source.provider': 'wikipedia',
      'source.review': { $exists: false },
      reviewedAt: { $exists: true },
      reviewerId: { $exists: true, $type: 'string' },
    },
    [
      {
        $set: {
          'source.review': {
            reviewerId: '$reviewerId',
            reviewedAt: '$reviewedAt',
            decision: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 'rejected', 'approved'],
            },
            reason: '$rejectionReason',
          },
        },
      },
    ],
  );

  const removedAuthorId = await collection.updateMany(
    { authorId: { $exists: true } },
    { $unset: { authorId: '' } },
  );

  const removedInvalidReview = await removeInvalidUserReview(collection);

  return {
    providerMigrated,
    userIdBackfilled: userIdBackfilled.modifiedCount,
    reviewerBackfilled: reviewerBackfilled.modifiedCount,
    removedAuthorId: removedAuthorId.modifiedCount,
    removedInvalidReview,
  };
};

const normalizeSeedingCollection = async (db, name) => {
  const collection = db.collection(name);

  const providerMigrated = await migrateSourceTypeToProvider(collection);

  const removedAuthorId = await collection.updateMany(
    { authorId: { $exists: true } },
    { $unset: { authorId: '' } },
  );

  const removedInvalidReview = await removeInvalidUserReview(collection);

  return {
    providerMigrated,
    removedAuthorId: removedAuthorId.modifiedCount,
    removedInvalidReview,
  };
};

const main = async () => {
  await client.connect();

  const db = client.db(databaseName);

  const adventures = await normalizeAdventureCollection(db);
  const seedingAdventures = await normalizeSeedingCollection(db, 'seeding_adventures');
  const seedingApprovals = await normalizeSeedingCollection(db, 'seeding_approvals');

  console.log('[Migration] adventures', adventures);
  console.log('[Migration] seeding_adventures', seedingAdventures);
  console.log('[Migration] seeding_approvals', seedingApprovals);
  console.log('[Migration] done');
};

main()
  .catch((error) => {
    console.error('[Migration] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
