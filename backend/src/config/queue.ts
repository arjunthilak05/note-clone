import Queue from 'bull';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Create job queues
export const pdfProcessingQueue = new Queue('pdf-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200 // Keep last 200 failed jobs
  }
});

// Queue event listeners
pdfProcessingQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

pdfProcessingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

pdfProcessingQueue.on('stalled', (job) => {
  console.warn(`⚠️  Job ${job.id} stalled`);
});

export default pdfProcessingQueue;
