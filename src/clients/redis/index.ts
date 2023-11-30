import Redis from "ioredis";

export const redisClient = new Redis(
  "redis://default:bfc98c6e29d54dee858b006427e69237@us1-noble-trout-38734.upstash.io:38734"
);