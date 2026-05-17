import { ObjectId } from 'mongodb';
import type { Readable } from 'stream';
import { getGridFSBucket } from './DBUtils';

const DEFAULT_BUCKET_NAME = 'uploads';

export interface UploadedFile {
  id: ObjectId;
  filename: string;
  contentType: string;
  length: number;
}

/**
 * Upload a file from Web File API directly to GridFS without buffering
 * Uses AsyncIterator to stream chunks without loading entire file into RAM
 */
export async function uploadFileFromWeb(objectId: ObjectId, file: File, bucketName = DEFAULT_BUCKET_NAME): Promise<UploadedFile> {
  const bucket = await getGridFSBucket(bucketName);

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStreamWithId(objectId, file.name, {
      metadata: { contentType: file.type }
    });

    uploadStream.on('finish', () => {
      resolve({
        id: uploadStream.id,
        filename: file.name,
        contentType: file.type,
        length: uploadStream.length
      });
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    // Stream chunks directly from Web ReadableStream without buffering
    const reader = file.stream().getReader();

    const processChunks = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            uploadStream.end();
            break;
          }

          // Convert Uint8Array to Buffer for GridFS compatibility
          const buffer = Buffer.from(value);

          // Write chunk and handle backpressure
          if (!uploadStream.write(buffer)) {
            // Wait for drain event if buffer is full
            await new Promise<void>((resolveDrain) => {
              uploadStream.once('drain', resolveDrain);
            });
          }
        }
      } catch (error) {
        uploadStream.destroy(error as Error);
        reject(error);
      }
    };

    processChunks();
  });
}

export async function uploadPictures(files: File[], bucketName = DEFAULT_BUCKET_NAME): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => {
    const objectId = new ObjectId(); // Generate a new ObjectId for each file
    return uploadFileFromWeb(objectId, file, bucketName);
  });
  return Promise.all(uploadPromises);
}

/**
 * Upload a file to GridFS from a Node.js Readable stream
 */
export async function uploadFile(
  stream: Readable,
  filename: string,
  objectId: ObjectId,
  contentType: string,
  bucketName = DEFAULT_BUCKET_NAME,
): Promise<UploadedFile> {
  const bucket = await getGridFSBucket(bucketName);

  return new Promise((resolve, reject) => {
    // Create an upload stream to GridFS
    const uploadStream = bucket.openUploadStreamWithId(objectId, filename, {
      metadata: { contentType }
    });

    // Handle stream completion
    uploadStream.on('finish', () => {
      resolve({
        id: uploadStream.id,
        filename,
        contentType,
        length: uploadStream.length
      });
    });

    // Handle stream error
    uploadStream.on('error', (error) => {
      reject(error);
    });

    stream.pipe(uploadStream);
  });
}

/**
 * Get a file stream from GridFS by its ID
 */
export async function getFileStream(fileId: ObjectId, bucketName = DEFAULT_BUCKET_NAME) {
  const bucket = await getGridFSBucket(bucketName);
  return bucket.openDownloadStream(fileId);
}

/**
 * Delete a file from GridFS
 */
export async function deleteFile(fileId: ObjectId, bucketName = DEFAULT_BUCKET_NAME) {
  const bucket = await getGridFSBucket(bucketName);
  return bucket.delete(fileId);
}

/**
 * Get file info from GridFS
 */
export async function getFileInfo(fileId: ObjectId, bucketName = DEFAULT_BUCKET_NAME) {
  const bucket = await getGridFSBucket(bucketName);
  // Find all files with the given _id
  const files = await bucket.find({ _id: fileId }).toArray();
  return files[0] || null;
}
