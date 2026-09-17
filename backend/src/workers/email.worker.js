import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.config.js';
import { 
    sendRegistrationEmail, 
    sendTransactionEmail, 
    sendTransactionFailureEmail 
} from '../services/email.service.js';

// Background Worker: listens for email jobs and processes them asynchronously
export const emailWorker = new Worker('email-queue', async (job) => {
    console.log(`📩 [EMAIL WORKER]: Processing job ID ${job.id} of type: ${job.data.type}`);
    const { type, payload } = job.data;

    try {
        switch (type) {
            case 'REGISTRATION':
                await sendRegistrationEmail(payload.email, payload.name);
                break;

            case 'TRANSACTION_SUCCESS':
                await sendTransactionEmail(payload.email, payload.name, payload.amount, payload.toAccount);
                break;

            case 'TRANSACTION_FAILURE':
                await sendTransactionFailureEmail(payload.email, payload.name, payload.amount, payload.toAccount);
                break;

            default:
                console.warn(`[EMAIL WORKER]: Unrecognized job type: ${type}`);
        }
        console.log(`✅ [EMAIL WORKER]: Successfully finished job ID ${job.id}`);
    } catch (error) {
        console.error(`❌ [EMAIL WORKER ERROR]: Failed processing job ID ${job.id}:`, error.message);
        throw error; // Re-throw so BullMQ triggers automatic exponential retry
    }
}, {
    connection: redisConnection,
    concurrency: 5 // Process up to 5 emails concurrently
});

emailWorker.on('completed', (job) => {
    console.log(`🎉 [EMAIL WORKER]: Job ${job.id} completed successfully.`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`⚠️ [EMAIL WORKER]: Job ${job?.id} failed on attempt ${job?.attemptsMade}:`, err.message);
});
