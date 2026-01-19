import "dotenv/config";
import crypto from "node:crypto";
import S3 from "aws-sdk/clients/s3.js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function mask(value: string) {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

async function main() {
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const bucket = requireEnv("CLOUDFLARE_R2_BUCKET");
  const region = process.env.CLOUDFLARE_R2_REGION || "";
  const regionSuffix = region ? `.${region}` : "";

  // IMPORTANT: These must be R2 *S3 API* keys (Access Key ID + Secret), not a Cloudflare API token.
  const accessKeyId = requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");

  const endpoint = `https://${accountId}${regionSuffix}.r2.cloudflarestorage.com`;

  console.log("[r2:test-upload] config", {
    bucket,
    endpoint,
    region: region || "(none)",
    accessKeyId: mask(accessKeyId),
    secretAccessKey: mask(secretAccessKey),
  });

  const s3 = new S3({
    endpoint,
    accessKeyId,
    secretAccessKey,
    signatureVersion: "v4",
    s3ForcePathStyle: false,
  });

  const key = `debug/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.txt`;
  const body = `r2 upload test @ ${new Date().toISOString()}\n`;

  console.log("[r2:test-upload] uploading", { bucket, key, bytes: body.length });
  const result = await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/plain",
    })
    .promise();

  console.log("[r2:test-upload] success", {
    bucket,
    key,
    etag: result.ETag,
    location: result.Location,
  });
}

main().catch((err: any) => {
  console.error("[r2:test-upload] FAILED", {
    code: err?.code,
    statusCode: err?.statusCode,
    message: err?.message,
  });
  process.exit(1);
});

