import { Redis } from "ioredis";
import { envVars } from "./src/app/config/env.js";

const redis = new Redis(envVars.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  connectTimeout: 5000,
  commandTimeout: 5000,
});

redis.on("connect", () => {
  console.log("✅ TCP connected");
});

redis.on("ready", async () => {
  try {
    const pong = await redis.ping();
    console.log("✅ Redis PING:", pong);
    const info = await redis.info("server");
    console.log("✅ Redis INFO:\n", info.split("\r\n").slice(0, 8).join("\n"));
    await redis.set("cns:diagnostic", "ok", "EX", 10);
    const val = await redis.get("cns:diagnostic");
    console.log("✅ SET/GET test:", val);
  } catch (err) {
    console.error("❌ Command failed:", err);
  } finally {
    await redis.quit();
    process.exit(0);
  }
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", (err as Error & { code?: string }).code ?? "UNKNOWN", err.message);
});

setTimeout(() => {
  console.error("❌ Timeout: could not connect within 10s");
  redis.disconnect();
  process.exit(1);
}, 10000);
