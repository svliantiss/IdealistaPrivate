import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Path to your Prisma schema
const schemaPath = path.resolve("prisma/schema.prisma");

// Read the schema
const schema = fs.readFileSync(schemaPath, "utf8");

// Extract model names (naive regex)
const modelRegex = /^model\s+(\w+)\s+{/gm;
const models = [];
let match;
while ((match = modelRegex.exec(schema)) !== null) {
  models.push(match[1]);
}

// Generate methods for each model
let interfaceContent = `import { prisma } from "./db";\nimport type { ${models.map(m => `${m}, Insert${m}`).join(", ")} } from "@shared/schema";\n\nexport interface IStorage {\n`;

for (const model of models) {
  interfaceContent += `  get${model}(id: number): Promise<${model} | undefined>;\n`;
  interfaceContent += `  getAll${model}s(): Promise<${model}[]>;\n`;
  interfaceContent += `  create${model}(data: Insert${model}): Promise<${model}>;\n`;
  interfaceContent += `  delete${model}(id: number): Promise<void>;\n\n`;
}

interfaceContent += `}\n\n`;

interfaceContent += `export class DatabaseStorage implements IStorage {\n`;

for (const model of models) {
  interfaceContent += `
  async get${model}(id: number): Promise<${model} | undefined> {
    return await prisma.${model[0].toLowerCase() + model.slice(1)}.findUnique({ where: { id } }) || undefined;
  }

  async getAll${model}s(): Promise<${model}[]> {
    return await prisma.${model[0].toLowerCase() + model.slice(1)}.findMany();
  }

  async create${model}(data: Insert${model}): Promise<${model}> {
    return await prisma.${model[0].toLowerCase() + model.slice(1)}.create({ data });
  }

  async delete${model}(id: number): Promise<void> {
    await prisma.${model[0].toLowerCase() + model.slice(1)}.delete({ where: { id } });
  }
`;
}

interfaceContent += `}\n\nexport const storage = new DatabaseStorage();\n`;

// Write to storage.ts
const outFile = path.resolve("storage.ts");
fs.writeFileSync(outFile, interfaceContent, "utf8");
console.log("✅ storage.ts generated with models:", models.join(", "));
