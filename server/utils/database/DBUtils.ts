import type { Db, Document } from "mongodb";
import { GridFSBucket, MongoClient, ServerApiVersion } from "mongodb";

let databasePromise: Promise<Db> | null = null;

const getDatabase = async (): Promise<Db> => {
  if (!databasePromise) {
    databasePromise = (async () => {
      const client = buildMongoClient();

      await client.connect();

      if (!process.env.MONGODB_DATABASE) {
        throw new Error("Please define the MONGODB_DATABASE environment variable inside .env.local");
      }

      const database = client.db(process.env.MONGODB_DATABASE);

      // Validate the connection lazily on first real access.
      await database.command({ ping: 1 });
      console.log("Successfully connected to MongoDB");

      return database;
    })().catch((error) => {
      // Allow subsequent calls to retry after a failed first attempt.
      databasePromise = null;
      console.error("Failed to connect to MongoDB", error);
      throw error;
    });
  }

  return databasePromise;
}

export async function getGridFSBucket(name: string): Promise<GridFSBucket> {
  const database = await getDatabase();

  return new GridFSBucket(database, {
    bucketName: name,
  });
}

const buildMongoClient = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
  }

  return new MongoClient(process.env.MONGODB_URI, {
    retryWrites: true,
    retryReads: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  })
}

const getCollection = async <T extends Document>(collectionName: string) => {
  const database = await getDatabase();
  return database.collection<T>(collectionName);
}

export {
  getCollection, getDatabase
};

