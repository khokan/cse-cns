import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/cnsweb",
  datasource: {
    url: env("DATABASE_URL_CNSWEB"),
  },
});
