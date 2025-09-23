import Redis from "ioredis";
import { serverEnv } from "../env/server";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(serverEnv.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }

  return redis;
}
