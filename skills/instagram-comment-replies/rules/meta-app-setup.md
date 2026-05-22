# Meta App Setup

## 1. Create a Facebook App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and click **Create App**.
2. Choose **Business** as the app type.
3. Fill in the app name and contact email, then click **Create App**.

## 2. Add the Instagram product

In your app dashboard, click **Add Product** and select **Instagram Graph API**.

## 3. Connect a Facebook Page and Instagram account

1. Under **Instagram Graph API → Basic Display**, click **Add or Remove Pages**.
2. Select the Facebook Page linked to your Instagram Professional account.
3. The Instagram Business/Creator account connected to that Page will be authorized automatically.

## 4. Request permissions

In **App Review → Permissions and Features**, request:

| Permission | Purpose |
|---|---|
| `instagram_basic` | Read profile and media |
| `instagram_manage_comments` | Read and reply to comments |
| `instagram_manage_messages` | Send DMs (comment-to-DM flow) |
| `pages_read_engagement` | Read page comment data |

For development/testing you can use these without App Review by adding your own account as a **Test User** under **Roles**.

## 5. Generate a long-lived access token

```bash
# Step 1 – get a short-lived token via the Graph API Explorer, then exchange:
curl "https://graph.facebook.com/v19.0/oauth/access_token\
?grant_type=fb_exchange_token\
&client_id={app-id}\
&client_secret={app-secret}\
&fb_exchange_token={short-lived-token}"
```

Long-lived tokens are valid for ~60 days. See [token-management.md](./token-management.md) for refresh logic.

## 6. Get your Instagram Business Account ID

```bash
curl "https://graph.facebook.com/v19.0/me/accounts?access_token={page-access-token}"
# Returns page ID and access token for each page

curl "https://graph.facebook.com/v19.0/{page-id}?fields=instagram_business_account&access_token={page-access-token}"
# Returns { "instagram_business_account": { "id": "..." } }
```

Store this ID as `IG_BUSINESS_ACCOUNT_ID` in your environment.

## 7. Register your webhook

```bash
curl -X POST "https://graph.facebook.com/v19.0/{app-id}/subscriptions" \
  -d "object=instagram" \
  -d "callback_url=https://your-domain.com/webhook" \
  -d "fields=comments,messages" \
  -d "verify_token=YOUR_RANDOM_VERIFY_TOKEN" \
  -d "access_token={app-access-token}"
```

Your `callback_url` must be publicly reachable over HTTPS. For local development, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Use the https://xxxx.ngrok.io URL as callback_url
```

## Environment variables

```env
APP_ID=your_app_id
APP_SECRET=your_app_secret
IG_ACCESS_TOKEN=your_long_lived_page_access_token
IG_BUSINESS_ACCOUNT_ID=your_ig_business_account_id
VERIFY_TOKEN=a_random_string_you_chose
```
