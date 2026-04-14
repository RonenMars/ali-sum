import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const dbUrl = process.env.TEST_DATABASE_URL ?? `file:${path.resolve(__dirname, "test.db")}`;

export default defineConfig({
  schema: "prisma/schema.test.prisma",
  datasource: {
    url: dbUrl,
  },
});
