import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import S3 from "aws-sdk/clients/s3.js";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";
import multer from "multer";

const app = express();
app.use(express.json());

function getR2Credentials() {
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Missing Cloudflare R2 credentials");
    }

    return { accessKeyId, secretAccessKey };
}

const { accessKeyId, secretAccessKey } = getR2Credentials();


const s3 = new S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  signatureVersion: "v4",
  s3ForcePathStyle: false, // IMPORTANT
});

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const storageController = async (req: express.Request, res: express.Response) => {
    try {
        console.log("🔐 [storageController] Received upload URL request");
        const { fileName, fileType } = req.body;
        console.log("📝 [storageController] Request details:", { fileName, fileType });

        const key = `${Date.now()}-${fileName}`;
        console.log("🔑 [storageController] Generated key:", key);

        const params = {
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
            Expires: 3600,
            ContentType: fileType,
        };
        console.log("⚙️ [storageController] S3 params:", params);

        // THIS IS THE IMPORTANT PART
        const signedUrl = await s3.getSignedUrlPromise("putObject", params);
        console.log("🔗 [storageController] Generated signed URL:", signedUrl.substring(0, 150) + "...");

        // Public URL (AFTER upload)
        const publicUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${process.env.CLOUDFLARE_R2_BUCKET}/${key}`;
        console.log("🌐 [storageController] Public URL:", publicUrl);

        console.log("✅ [storageController] Sending response to client");
        res.json({ signedUrl, publicUrl });
    } catch (err) {
        console.error("❌ [storageController] Error:", err);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}

// NEW: Direct upload through backend (bypasses CORS)
export const directUploadController = async (req: express.Request, res: express.Response) => {
    try {
        console.log("📤 [directUploadController] Received direct upload request");
        
        // @ts-ignore - file is added by multer
        const file = req.file;
        if (!file) {
            console.error("❌ [directUploadController] No file in request");
            return res.status(400).json({ error: "No file provided" });
        }

        console.log("📁 [directUploadController] File details:", {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
        });

        const key = `${Date.now()}-${file.originalname}`;
        console.log("🔑 [directUploadController] Generated key:", key);

        // Upload directly to R2 from backend
        const uploadParams = {
            Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        console.log("☁️ [directUploadController] Uploading to R2...");
        await s3.upload(uploadParams).promise();

        const publicUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${process.env.CLOUDFLARE_R2_BUCKET}/${key}`;
        console.log("✅ [directUploadController] Upload successful!");
        console.log("🔗 [directUploadController] Public URL:", publicUrl);

        res.json({ publicUrl });
    } catch (err) {
        console.error("❌ [directUploadController] Error:", err);
        res.status(500).json({ error: "Failed to upload file" });
    }
}

export const uploadMiddleware = upload.single("file");
