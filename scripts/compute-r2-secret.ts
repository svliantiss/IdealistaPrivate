/**
 * Compute R2 Secret Access Key from API token value
 * 
 * Per Cloudflare docs: https://developers.cloudflare.com/r2/api/tokens/
 * - Access Key ID: The `id` of the API token
 * - Secret Access Key: The SHA-256 hash of the API token `value`
 */
import crypto from "crypto";

const tokenValue = process.argv[2];

if (!tokenValue) {
  console.log("Usage: npx tsx scripts/compute-r2-secret.ts <API_TOKEN_VALUE>");
  console.log("");
  console.log("Example:");
  console.log("  npx tsx scripts/compute-r2-secret.ts fq4NsGF7yp9NQgudbPDqaaT8uNcwR2dT9D5dGTqD");
  process.exit(1);
}

// Compute SHA-256 hash of the token value
const secretAccessKey = crypto.createHash("sha256").update(tokenValue).digest("hex");

console.log("");
console.log("=".repeat(60));
console.log("R2 S3 API Credentials (derived from API token)");
console.log("=".repeat(60));
console.log("");
console.log("Your API token value:", tokenValue);
console.log("");
console.log("SECRET ACCESS KEY (SHA-256 hash):");
console.log(secretAccessKey);
console.log("");
console.log("=".repeat(60));
console.log("");
console.log("Now update your .env file:");
console.log("");
console.log(`CLOUDFLARE_R2_ACCESS_KEY_ID=<token_id_from_cloudflare_dashboard>`);
console.log(`CLOUDFLARE_R2_SECRET_ACCESS_KEY=${secretAccessKey}`);
console.log("");
console.log("To find your token ID:");
console.log("1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens");
console.log("2. Find the token you created");
console.log("3. Copy the token ID (not the value)");
console.log("");
