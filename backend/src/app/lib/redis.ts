import { Redis } from "ioredis";
import { envVars } from "../config/env.js";
import logger from "../utils/logger.js";

type RedisError = Error & { code?: string };

const getErrorCode = (err: RedisError): string => err.code ?? "UNKNOWN";

let hasLoggedRedisError = false;
let hasLoggedBullMqError = false;

const redisOptions = {
    enableReadyCheck: false,
    lazyConnect: true,
    enableOfflineQueue: false,
    reconnectOnError: (err: RedisError) => {
        const code = getErrorCode(err);
        logger.warn(`⚠️ [Redis] Connection error (${code}) — retrying in background.`);
        return true; // Keep retrying in background
    },
    retryStrategy: (times: number) => {
        if (times === 1 && !hasLoggedRedisError) {
            logger.warn(`⚠️ [Redis] Connection unavailable at ${envVars.REDIS_URL.replace(/:\/\/.*@/, "://***@")}. System running with direct database queries & fallback job execution.`);
        }
        const delay = Math.min(times * 1000, 5000);
        return delay;
    },
};

// Cache/general-purpose Redis client
export const redisClient = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: 1,
    commandTimeout: 2000,
});

// Dedicated BullMQ connection
export const bullMqRedisConnection = new Redis(envVars.REDIS_URL, {
    ...redisOptions,
    maxRetriesPerRequest: null,
});

/**
 * Initiates Redis connections in the background.
 * Errors are intentionally swallowed here — the 'error' event listeners
 * on each client handle logging. The app proceeds normally without Redis.
 */
export function connectRedis(): void {
    redisClient.connect().catch(() => { /* handled by 'error' event */ });
    bullMqRedisConnection.connect().catch(() => { /* handled by 'error' event */ });
}

export function isRedisConnected(): boolean {
    return redisClient.status === "ready" || redisClient.status === "connect";
}

export function isBullMqRedisConnected(): boolean {
    return bullMqRedisConnection.status === "ready" || bullMqRedisConnection.status === "connect";
}

redisClient.on("error", (err) => {
    if (!hasLoggedRedisError) {
        logger.warn(`⚠️ [Redis] Connection notice: ${err.message}. System continuing normally without cache.`);
        hasLoggedRedisError = true;
    }
});

redisClient.on("ready", () => {
    hasLoggedRedisError = false;
    logger.info("✅ [Redis] Connection established & ready.");
});

redisClient.on("connect", () => {
    hasLoggedRedisError = false;
    logger.info("✅ [Redis] Connected to Redis server.");
});

bullMqRedisConnection.on("error", (err) => {
    if (!hasLoggedBullMqError) {
        logger.warn(`⚠️ [BullMQ Redis] Connection notice: ${err.message}. System continuing normally with direct queue fallback.`);
        hasLoggedBullMqError = true;
    }
});

bullMqRedisConnection.on("ready", () => {
    hasLoggedBullMqError = false;
    logger.info("✅ [BullMQ Redis] Connection ready.");
});

bullMqRedisConnection.on("connect", () => {
    hasLoggedBullMqError = false;
    logger.info("✅ [BullMQ Redis] Connected.");
});

// Generic JSON cache helpers with safe connection checks
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        if (!isRedisConnected()) return null;
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.warn(`[Redis] Cache miss/get error for key ${key}:`, (err as Error).message);
        return null;
    }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
        if (!isRedisConnected()) return;
        await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
        logger.warn(`[Redis] Cache set error for key ${key}:`, (err as Error).message);
    }
}

export async function cacheDel(key: string): Promise<void> {
    try {
        if (!isRedisConnected()) return;
        await redisClient.del(key);
    } catch (err) {
        logger.warn(`[Redis] Cache delete error for key ${key}:`, (err as Error).message);
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
