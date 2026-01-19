import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const tokens = import.meta.env.VITE_CLOUDFLARE_R2_TOKEN;
console.log({ tokens })

// utils/storage.ts
// utils/r2-upload.ts

// Initialize S3 client with your R2 credentials
const createS3Client = () => {
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Missing Cloudflare R2 environment variables');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Main upload function
export const uploadToR2 = async (file: File): Promise<{ url: string; key: string }> => {
  try {
    const s3Client = createS3Client();
    const bucketName = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET;
    
    // Generate unique file key
    const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: file.type,
      // Optional metadata
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate presigned URL (valid for 1 hour)
    console.log('Generating presigned URL...');
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    console.log('Uploading file to:', signedUrl);

    // Upload file using the presigned URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status: ${uploadResponse.status}`);
    }

    console.log('Upload successful!');

    // Return the public URL
    const publicUrl = `https://pub-${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.dev/${key}`;
    
    return {
      url: publicUrl,
      key,
    };

  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Optional: List files in bucket (for debugging)
export const listR2Files = async (prefix = 'uploads/'): Promise<string[]> => {
  try {
    const s3Client = createS3Client();
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    const command = new ListObjectsV2Command({
      Bucket: import.meta.env.VITE_CLOUDFLARE_R2_BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(item => item.Key || '') || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

// Optional: Delete file
export const deleteR2File = async (key: string): Promise<boolean> => {
  try {
    const s3Client = createS3Client();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new DeleteObjectCommand({
      Bucket: import.meta.env.VITE_CLOUDFLARE_R2_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};