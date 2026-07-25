import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/cns",
  datasource: {
    url: env("DATABASE_URL_CNS"),
  },
});
