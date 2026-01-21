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

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/7f66b6de-517e-40b6-bc43-923823ed68cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storageController.ts:15',message:'R2 credentials check',data:{hasAccessKey:!!accessKeyId,accessKeyPrefix:accessKeyId?.substring(0,8),hasSecret:!!secretAccessKey,secretPrefix:secretAccessKey?.substring(0,8)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Missing Cloudflare R2 credentials");
    }

    return { accessKeyId, secretAccessKey };
}

const { accessKeyId, secretAccessKey } = getR2Credentials();


// #region agent log
const region = process.env.CLOUDFLARE_R2_REGION || ''; // e.g., 'eu', 'apac'
const regionSuffix = region ? `.${region}` : '';
const r2Config = {
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}${regionSuffix}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  signatureVersion: "v4",
  s3ForcePathStyle: false,
};
fetch('http://127.0.0.1:7246/ingest/7f66b6de-517e-40b6-bc43-923823ed68cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storageController.ts:28',message:'S3 client config',data:{endpoint:r2Config.endpoint,accountId:process.env.CLOUDFLARE_ACCOUNT_ID,bucket:process.env.CLOUDFLARE_R2_BUCKET,region:region,signatureVersion:r2Config.signatureVersion,s3ForcePathStyle:r2Config.s3ForcePathStyle},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D,E'})}).catch(()=>{});
// #endregion

const s3 = new S3(r2Config);

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 10MB limit
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

        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/7f66b6de-517e-40b6-bc43-923823ed68cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storageController.ts:102',message:'Before R2 upload',data:{bucket:uploadParams.Bucket,key:uploadParams.Key,contentType:uploadParams.ContentType,bodySize:file.buffer.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
        // #endregion

        console.log("☁️ [directUploadController] Uploading to R2...");
        try {
            await s3.upload(uploadParams).promise();
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/7f66b6de-517e-40b6-bc43-923823ed68cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storageController.ts:110',message:'R2 upload SUCCESS',data:{bucket:uploadParams.Bucket,key:key},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
        } catch (uploadError: any) {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/7f66b6de-517e-40b6-bc43-923823ed68cc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'storageController.ts:115',message:'R2 upload FAILED',data:{errorCode:uploadError.code,errorMessage:uploadError.message,statusCode:uploadError.statusCode,bucket:uploadParams.Bucket,endpoint:r2Config.endpoint},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
            // #endregion
            throw uploadError;
        }

        const publicUrl = `https://pub-cfe8b9c757834aadbb6cb1a1944f89a2.r2.dev/${key}`;
        console.log("✅ [directUploadController] Upload successful!");
        console.log("🔗 [directUploadController] Public URL:", publicUrl);

        res.json({ publicUrl });
    } catch (err) {
        console.error("❌ [directUploadController] Error:", err);
        res.status(500).json({ error: "Failed to upload file" });
    }
}

export const uploadMiddleware = upload.single("file");
