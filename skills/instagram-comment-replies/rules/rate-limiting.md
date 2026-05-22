# Rate Limiting & Queuing

## Meta API limits

Instagram Graph API uses a **per-app, per-user** rate limit. Exceeding it returns HTTP `429` with a `X-App-Usage` header showing current utilization.

Key limits (subject to change — always check Meta docs):
- **200 API calls per hour** per user token for most endpoints
- **Comment replies**: treated as write operations; stay well under the limit

## Exponential backoff on 429

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 5
): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;

    const retryAfter = Number(res.headers.get('Retry-After') ?? 0);
    const delay = retryAfter * 1000 || Math.pow(2, attempt) * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error('Max retries exceeded');
}
```

## Job queue with BullMQ

Process replies asynchronously to avoid blocking the webhook handler and to respect rate limits:

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

const replyQueue = new Queue('instagram-replies', { connection });

// Enqueue from webhook handler
await replyQueue.add(
  'reply',
  { commentId, replyText, accessToken },
  { attempts: 5, backoff: { type: 'exponential', delay: 2000 } }
);

// Worker processes one job at a time
new Worker(
  'instagram-replies',
  async (job) => {
    const { commentId, replyText, accessToken } = job.data;
    await replyToComment(commentId, replyText, accessToken);
  },
  { connection, concurrency: 1 }
);
```

## Deduplication with Redis

Prevent double-replies when Meta delivers the same webhook event more than once:

```typescript
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

async function isAlreadyProcessed(commentId: string): Promise<boolean> {
  const key = `processed:comment:${commentId}`;
  const set = await redis.set(key, '1', { NX: true, EX: 86400 }); // 24h TTL
  return set === null; // null means key already existed
}

// In webhook handler:
if (await isAlreadyProcessed(commentId)) return;
await replyQueue.add('reply', { commentId, replyText, accessToken });
```

## Monitor queue health

```typescript
const counts = await replyQueue.getJobCounts(
  'waiting', 'active', 'completed', 'failed'
);
console.log('Queue status:', counts);
```

Failed jobs are automatically retried with exponential backoff up to `attempts` times. Inspect failures:

```typescript
const failed = await replyQueue.getFailed();
failed.forEach((job) => console.error(job.id, job.failedReason));
```
