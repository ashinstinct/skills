# Webhook Handler

## Verification handshake

Meta sends a GET to your webhook URL when you register it. Your server must echo back `hub.challenge`:

```typescript
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

## Always acknowledge immediately

Respond with `200 OK` before doing any async work. Meta retries if it doesn't get a 200 within 20 seconds, which causes duplicate events:

```typescript
app.post('/webhook', (req, res) => {
  res.sendStatus(200); // must be first

  processWebhookAsync(req.body).catch(console.error);
});
```

## Idempotency key

Store processed comment IDs so retried webhook deliveries don't trigger duplicate replies:

```typescript
const processed = new Set<string>(); // use Redis in production

async function processWebhookAsync(body: unknown) {
  const entries = (body as any)?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      if (change.field !== 'comments') continue;
      const commentId: string = change.value?.id;
      if (!commentId || processed.has(commentId)) continue;
      processed.add(commentId);
      await handleComment(change.value);
    }
  }
}
```

## Signature verification (recommended)

Validate that requests actually come from Meta using the `X-Hub-Signature-256` header:

```typescript
import crypto from 'crypto';

function verifySignature(rawBody: Buffer, signature: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.APP_SECRET!)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-hub-signature-256'] as string;
  if (!sig || !verifySignature(req.body, sig)) {
    return res.sendStatus(403);
  }
  res.sendStatus(200);
  processWebhookAsync(JSON.parse(req.body.toString())).catch(console.error);
});
```
