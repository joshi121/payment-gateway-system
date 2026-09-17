import { Redis } from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Unified Redis connection instance for BullMQ & Caching
const redisOptions = {
    maxRetriesPerRequest: null, // Required by BullMQ
    retryStrategy(times) {
        // Reconnect with exponential backoff up to 2 seconds
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

export const redisConnection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisOptions)
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        ...redisOptions
    });

redisConnection.on('connect', () => {
    console.log(' [REDIS]: Connected to Redis server successfully!');
});

redisConnection.on('error', (err) => {
    console.warn('⚠️ [REDIS WARNING]: Redis connection error:', err.message);
});
