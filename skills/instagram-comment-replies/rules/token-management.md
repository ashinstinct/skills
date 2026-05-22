# Token Management

## Token types

| Token type | Lifespan | Use |
|---|---|---|
| Short-lived user token | ~1 hour | Initial auth only |
| Long-lived user token | ~60 days | Server-side API calls |
| Long-lived page token | Never expires* | Preferred for automation |

*Page access tokens derived from a long-lived user token do not expire as long as the user hasn't revoked app permissions.

## Get a long-lived page access token

```typescript
// Step 1: exchange short-lived user token for long-lived user token
async function getLongLivedUserToken(shortLivedToken: string): Promise<string> {
  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', process.env.APP_ID!);
  url.searchParams.set('client_secret', process.env.APP_SECRET!);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const res = await fetch(url.toString());
  const data = await res.json();
  return data.access_token;
}

// Step 2: get the page access token (these don't expire)
async function getPageAccessToken(
  pageId: string,
  longLivedUserToken: string
): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${longLivedUserToken}`
  );
  const data = await res.json();
  return data.access_token;
}
```

## Check token expiry

```typescript
async function inspectToken(token: string): Promise<{ expiresAt: Date | null; isValid: boolean }> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${process.env.APP_ID}|${process.env.APP_SECRET}`
  );
  const { data } = await res.json();
  return {
    isValid: data.is_valid,
    expiresAt: data.expires_at ? new Date(data.expires_at * 1000) : null,
  };
}
```

## Refresh before expiry

Schedule a check ~7 days before a long-lived user token expires (page tokens don't need this):

```typescript
import cron from 'node-cron';

cron.schedule('0 9 * * *', async () => { // daily at 9am
  const { isValid, expiresAt } = await inspectToken(process.env.IG_ACCESS_TOKEN!);
  if (!isValid) {
    console.error('Token is invalid — manual re-auth required');
    return;
  }
  if (expiresAt) {
    const daysLeft = (expiresAt.getTime() - Date.now()) / 86_400_000;
    if (daysLeft < 7) {
      console.warn(`Token expires in ${daysLeft.toFixed(0)} days — refresh soon`);
      // trigger alert / re-auth flow
    }
  }
});
```

## Secure storage

- Store tokens in environment variables or a secrets manager (AWS Secrets Manager, Doppler, etc.)
- Never commit tokens to source control
- Rotate `APP_SECRET` if it is ever exposed
