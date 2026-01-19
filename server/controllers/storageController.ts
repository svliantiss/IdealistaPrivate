import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import S3 from "aws-sdk/clients/s3.js";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";

const app = express();
app.use(express.json());

function getR2Credentials() {
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID2;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY2;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Missing Cloudflare R2 credentials");
    }

    return { accessKeyId, secretAccessKey };
}

const { accessKeyId, secretAccessKey } = getR2Credentials();


const s3 = new S3({
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID2}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID2!,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY2!,
  signatureVersion: "v4",
  s3ForcePathStyle: false, // IMPORTANT
});
export const storageController = async (req: express.Request, res: express.Response) => {
    try {
        const { fileName, fileType } = req.body;

        const key = `${Date.now()}-${fileName}`;

        // THIS IS THE IMPORTANT PART
        const signedUrl = await s3.getSignedUrlPromise("putObject", {
            Bucket: process.env.CLOUDFLARE_R2_BUCKET2!,
            Key: key,
            Expires: 3600,
            ContentType: fileType, // <-- forces content-type signing
        });

        // Public URL (AFTER upload)
        const publicUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID2}.r2.dev/${process.env.CLOUDFLARE_R2_BUCKET2}/${key}`;

        res.json({ signedUrl, publicUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}

