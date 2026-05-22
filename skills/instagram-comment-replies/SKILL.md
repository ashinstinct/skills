---
name: instagram-comment-replies
description: Auto-reply to Instagram comments using the Meta Graph API - a ManyChat-style comment automation system
metadata:
  tags: instagram, meta, api, automation, comments, webhooks, manychat
---

## When to use

Use this skill when building a system that automatically replies to Instagram post comments based on keyword triggers — similar to what ManyChat offers.

## Overview

Instagram comment auto-reply works by:
1. Subscribing to comment webhooks via the Meta Graph API
2. Matching incoming comment text against keyword rules
3. Replying to the comment and/or sending a DM to the commenter

## Prerequisites

- A **Facebook App** created at [developers.facebook.com](https://developers.facebook.com)
- An **Instagram Professional account** (Creator or Business) connected to a Facebook Page
- Your app must have the following permissions approved:
  - `instagram_basic`
  - `instagram_manage_comments`
  - `instagram_manage_messages` (for DM replies)
  - `pages_read_engagement`

See [rules/meta-app-setup.md](./rules/meta-app-setup.md) for step-by-step app configuration.

## Webhook Setup

Subscribe your server to receive Instagram comment events:

```bash
# Register a webhook subscription for your app
curl -X POST \
  "https://graph.facebook.com/v19.0/{app-id}/subscriptions" \
  -d "object=instagram" \
  -d "callback_url=https://your-server.com/webhook" \
  -d "fields=comments" \
  -d "verify_token=YOUR_VERIFY_TOKEN" \
  -d "access_token={app-access-token}"
```

Your webhook endpoint must handle both:
- **GET** requests for the initial verification challenge
- **POST** requests for incoming comment events

See [rules/webhook-handler.md](./rules/webhook-handler.md) for the full server implementation.

## Comment Event Payload

When a comment is posted, Meta sends a POST to your webhook:

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "INSTAGRAM_BUSINESS_ACCOUNT_ID",
      "time": 1234567890,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "COMMENT_ID",
            "text": "How do I get this?",
            "from": {
              "id": "USER_ID",
              "username": "commenter_handle"
            },
            "media": {
              "id": "MEDIA_ID",
              "media_product_type": "POST"
            },
            "timestamp": "2024-01-01T12:00:00+0000"
          }
        }
      ]
    }
  ]
}
```

## Keyword Matching

Match comment text against trigger keywords before replying:

```typescript
interface ReplyRule {
  keywords: string[];       // triggers (case-insensitive)
  matchType: 'any' | 'all'; // 'any' = OR, 'all' = AND
  commentReply?: string;    // public comment reply text
  dmReply?: string;         // private DM text (optional)
}

function matchesRule(commentText: string, rule: ReplyRule): boolean {
  const text = commentText.toLowerCase();
  const check = (kw: string) => text.includes(kw.toLowerCase());
  return rule.matchType === 'any'
    ? rule.keywords.some(check)
    : rule.keywords.every(check);
}
```

See [rules/keyword-matching.md](./rules/keyword-matching.md) for advanced matching patterns.

## Replying to a Comment

Use the Instagram Graph API to post a public reply:

```typescript
async function replyToComment(
  commentId: string,
  replyText: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${commentId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: replyText,
        access_token: accessToken,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}
```

## Sending a DM to a Commenter

After a keyword match, send a private message to the commenter:

```typescript
async function sendDM(
  igBusinessAccountId: string,
  recipientIgUserId: string,
  message: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${igBusinessAccountId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientIgUserId },
        message: { text: message },
        messaging_type: 'RESPONSE',
        access_token: accessToken,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
}
```

Note: The DM API requires the user to have previously messaged your account, OR you must use a 24-hour messaging window opened by a comment reply keyword interaction (the "comment-to-DM" flow Meta supports natively).

## Full Flow Example

```typescript
import express from 'express';

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN!;
const IG_ACCOUNT_ID = process.env.IG_BUSINESS_ACCOUNT_ID!;

const rules: ReplyRule[] = [
  {
    keywords: ['link', 'info', 'how'],
    matchType: 'any',
    commentReply: 'Check your DMs! 📩',
    dmReply: 'Hey! Here is the link you asked for: https://example.com',
  },
  {
    keywords: ['price', 'cost', 'how much'],
    matchType: 'any',
    commentReply: 'DM sent with pricing details!',
    dmReply: 'Hi! Our pricing starts at $29/mo. Visit https://example.com/pricing',
  },
];

// Webhook verification
app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === VERIFY_TOKEN
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Incoming comment events
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // acknowledge immediately

  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      const { id: commentId, text, from } = change.value;
      if (!text || !commentId) continue;

      for (const rule of rules) {
        if (!matchesRule(text, rule)) continue;

        if (rule.commentReply) {
          await replyToComment(commentId, rule.commentReply, ACCESS_TOKEN);
        }
        if (rule.dmReply && from?.id) {
          await sendDM(IG_ACCOUNT_ID, from.id, rule.dmReply, ACCESS_TOKEN);
        }
        break; // first matching rule wins
      }
    }
  }
});

app.listen(3000);
```

## Rate Limiting

Meta enforces API rate limits. To avoid being blocked:

- **Deduplicate**: store processed comment IDs to avoid replying twice (webhooks can fire more than once for the same event).
- **Queue replies**: use a job queue (e.g. BullMQ, Inngest) rather than replying inline in the webhook handler.
- **Back off on 429s**: retry with exponential backoff when the API returns `429 Too Many Requests`.

See [rules/rate-limiting.md](./rules/rate-limiting.md) for a full deduplication and queuing implementation.

## Compliance

- Do not send unsolicited DMs — only reply to users who commented first.
- Disclose automation if Instagram's policies require it for your account type.
- Keep `access_token` values in environment variables, never in source code.
- Tokens expire — use long-lived tokens and implement refresh logic. See [rules/token-management.md](./rules/token-management.md).
