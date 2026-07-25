import "dotenv/config";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient as PrismaClientCnsWeb } from "../../generated/cnsweb/client";
import { PrismaClient as PrismaClientCns } from "../../generated/cns/client";
import { envVars } from "../config/env";

// ---------------------------------------------------------------------------
// Connection string parser
// sqlserver://host:port;database=X;user=Y;password=Z;trustServerCertificate=true
// ---------------------------------------------------------------------------
function parseConnectionString(url: string) {
  const withoutProtocol = url.replace("sqlserver://", "");
  const [hostPort, ...paramParts] = withoutProtocol.split(";");
  const [host, port] = hostPort.split(":");

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const [key, ...valueParts] = part.split("=");
    if (key) params[key.toLowerCase()] = valueParts.join("=");
  }

  return {
    server: host,
    port: parseInt(port || "1433", 10),
    database: params.database,
    user: params.user,
    password: params.password,
    options: {
      encrypt: false,
      trustServerCertificate: params.trustservercertificate === "true",
    },
  };
}

// ---------------------------------------------------------------------------
// DatabaseManager – a singleton that holds one PrismaClient per database.
//
// Usage:
//   import { db } from '@/app/lib/prisma';
//   const users = await db.cnsWeb.user.findMany();
//   const rows  = await db.cns.someModel.findMany();
// ---------------------------------------------------------------------------
class DatabaseManager {
  private static instance: DatabaseManager;

  /** Prisma client connected to the CNSWeb database */
  readonly cnsWeb: PrismaClientCnsWeb;

  /** Prisma client connected to the CNS database */
  readonly cns: PrismaClientCns;

  private constructor() {
    this.cnsWeb = this._createClient(PrismaClientCnsWeb, envVars.DATABASE_URL_CNSWEB, "CNSWeb");
    this.cns    = this._createClient(PrismaClientCns,    envVars.DATABASE_URL_CNS,    "CNS");
  }

  /** Returns (or creates) the single shared instance. */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /** Builds a PrismaClient with a MSSQL adapter for the given connection URL. */
  private _createClient<T>(ClientClass: new (options: any) => T, url: string, label: string): T {
    const config  = parseConnectionString(url);
    const adapter = new PrismaMssql(config);

    return new ClientClass({
      adapter,
      log:
        envVars.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query"  },
              { emit: "stdout", level: "error"  },
              { emit: "stdout", level: "warn"   },
            ]
          : [{ emit: "stdout", level: "error" }],
    });
  }

  /**
   * Gracefully disconnect both clients.
   * Call this on process exit / test teardown.
   */
  async disconnect(): Promise<void> {
    await Promise.all([this.cnsWeb.$disconnect(), this.cns.$disconnect()]);
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Singleton DatabaseManager – access both DBs through `db.cnsWeb` / `db.cns` */
export const db = DatabaseManager.getInstance();

/** Backward-compatible alias – still points to the CNSWeb client */
export const prisma = db.cnsWeb;