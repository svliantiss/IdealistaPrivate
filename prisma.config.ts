import "dotenv/config"; // loads .env automatically
import { defineConfig, env } from "prisma/config"; // correct import

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL, // your DATABASE_URL here
  },
});
