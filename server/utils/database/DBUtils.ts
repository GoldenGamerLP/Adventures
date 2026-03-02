import type { Db } from "mongodb";
import { GridFSBucket, MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  retryWrites: true,
  retryReads: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

const database = client.db(process.env.MONGODB_DATABASE);

// Initialize GridFS bucket
let gridFSBucket: GridFSBucket;

export async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Initialize GridFS bucket after connection
    gridFSBucket = new GridFSBucket(database, {
      bucketName: 'uploads'
    });
    
    return { client, database, gridFSBucket };
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

// Call this during server startup
connectToDatabase().catch(console.error);

export function getGridFSBucket(): GridFSBucket {
  if (!gridFSBucket) {
    throw new Error('GridFS bucket not initialized. Make sure to connect to the database first.');
  }
  return gridFSBucket;
}

//When nodejs/shutdown
process.on("SIGINT", async () => {
  console.log("Closing MongoDB connection");
  await client.close();
});

export default database as Db;