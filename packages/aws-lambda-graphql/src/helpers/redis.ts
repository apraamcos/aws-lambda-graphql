import Redis from "ioredis";
import { deleteMemoryCache, getMemoryCache, memoryCache } from "./memoryCache";

export const getRedisClient = async (host: string) => {
  const redisKey = `redis_${host}`;
  const currentRedis = await getMemoryCache(redisKey);
  if (currentRedis?.value.manuallyClosing) {
    deleteMemoryCache(redisKey);
  }
  return await memoryCache(
    redisKey,
    async () =>
      new Redis({
        connectTimeout: 10000,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        },
        host
      }),
    {
      lock: true
    }
  );
};
