import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../../generated/prisma/client";
import { envVars } from "../config/env";

function parseConnectionString(url: string) {
  // Format: sqlserver://host:port;database=X;user=Y;password=Z;...
  const withoutProtocol = url.replace("sqlserver://", "");
  const [hostPort, ...paramParts] = withoutProtocol.split(";");
  const [host, port] = hostPort.split(":");

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [key, ...valueParts] = part.split("=");
    params[key.toLowerCase()] = valueParts.join("=");
  }

  return {
    server: host,
    port: parseInt(port || "1433", 10),
    database: params.database,
    user: params.user,
    password: params.password,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
}

const config = parseConnectionString(envVars.DATABASE_URL);
const adapter = new PrismaMssql(config);
const prisma = new PrismaClient({ adapter });

export { prisma };