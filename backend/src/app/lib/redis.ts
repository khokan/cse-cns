import { Redis } from "ioredis";
import { envVars } from "../config/env.js";

type RedisError = Error & { code?: string };

const getErrorCode = (err: RedisError): string => err.code ?? "UNKNOWN";

const redisOptions = {
    enableReadyCheck: true,
    lazyConnect: false,
    reconnectOnError: (err: RedisError) => {
        const code = getErrorCode(err);
        const fatal = ["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND"].includes(code);
        console.warn(`⚠️ [Redis] reconnectOnError: ${code} — ${fatal ? "abort" : "retry"}`);
        return !fatal;
    },
    retryStrategy: (times: number) => {
        if (times > 5) {
            console.error("❌ [Redis] Max reconnection attempts reached.");
            return null;
        }
        const delay = Math.min(times * 500, 3000);
        console.log(`🔁 [Redis] Reconnecting in ${delay}ms... (attempt ${times})`);
        return delay;
    },
};

// Cache/general-purpose Redis client with retries
export const redisClient = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: 3,
});

// Dedicated BullMQ connection: blocking commands require maxRetriesPerRequest = null
export const bullMqRedisConnection = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: null,
});

redisClient.on("error", (err) => {
    console.error("❌ [Redis] Connection error:", getErrorCode(err), err.message);
});

redisClient.on("connect", () => {
    console.log("✅ [Redis] Connected to", envVars.REDIS_URL.replace(/:\/\/.*@/, "://***@"));
});

redisClient.on("reconnecting", () => {
    console.log("🔁 [Redis] Reconnecting...");
});

bullMqRedisConnection.on("error", (err) => {
    console.error("❌ [BullMQ Redis] Connection error:", getErrorCode(err), err.message);
});

bullMqRedisConnection.on("connect", () => {
    console.log("✅ [BullMQ Redis] Connected");
});

// Generic JSON cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`[Redis] Failed to get key ${key}:`, err);
        return null;
    }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
        console.error(`[Redis] Failed to set key ${key}:`, err);
    }
}

export async function cacheDel(key: string): Promise<void> {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`[Redis] Failed to delete key ${key}:`, err);
    }
}

// Dedicated Report Cache helpers (scoped strictly to Report jobs)
export const reportCache = {
    getMembersList: async <T>() => cacheGet<T>("cache:report:members"),
    setMembersList: async <T>(data: T) => cacheSet("cache:report:members", data, 300), // 5 min
    getJob: async <T>(id: string) => cacheGet<T>(`cache:report:job:${id}`),
    setJob: async <T>(id: string, data: T) => cacheSet(`cache:report:job:${id}`, data, 10), // 10s
    invalidateJob: async (id: string) => cacheDel(`cache:report:job:${id}`),
};
