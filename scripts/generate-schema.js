import fs from "fs";
import path from "path";

const schemaPath = path.resolve("prisma/schema.prisma");
const outPath = path.resolve("schema.ts");

const schema = fs.readFileSync(schemaPath, "utf8");

// Extract model names
const modelRegex = /^model\s+(\w+)\s+{/gm;
const models = [];
let match;
while ((match = modelRegex.exec(schema)) !== null) {
  models.push(match[1]);
}

// Generate TypeScript types
let tsContent = `// Prisma types
import type { ${models.map(m => `${m} as Prisma${m}`).join(", ")} } from "@prisma/client";
import { z } from "zod";

// Re-export Prisma types
${models.map(m => `export type ${m} = Prisma${m};`).join("\n")}

// Zod validation schemas for inserts
`;

// Simple insert schema generation (all fields required except id & createdAt)
for (const model of models) {
  tsContent += `\nexport const insert${model}Schema = z.object({\n  // Add fields here manually or extend script to parse schema fields\n});\n`;
  tsContent += `export type Insert${model} = z.infer<typeof insert${model}Schema>;\n`;
}

fs.writeFileSync(outPath, tsContent, "utf8");
console.log("✅ schema.ts generated with models:", models.join(", "));
