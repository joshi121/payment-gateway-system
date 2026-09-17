import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.config.js';

// Initialize the email job queue on Redis
export const emailQueue = new Queue('email-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, // Auto-retry up to 3 times on failure
        backoff: {
            type: 'exponential',
            delay: 2000 // 2s, 4s, 8s...
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour for debugging
            count: 1000
        },
        removeOnFail: {
            age: 86400 // Keep failed jobs for 24 hours
        }
    }
});
