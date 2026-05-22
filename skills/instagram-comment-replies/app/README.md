# Instagram Auto Reply — Flutter App

A ManyChat-style app for your phone. It polls Instagram every 2 minutes (configurable), detects comments matching your keyword rules, and auto-replies publicly and/or by DM.

## Screens

| Tab | What it does |
|-----|-------------|
| **Home** | On/off switch, poll interval, live activity log |
| **Rules** | Add / edit / delete keyword reply rules |
| **Settings** | Paste your API credentials and test the connection |

## Setup

### 1. Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) installed (3.10+)
- Android Studio or Xcode for building to your device
- A Meta developer account and Instagram Professional account

### 2. Create the Flutter project

```bash
flutter create . --project-name instagram_auto_reply
```

This generates the platform boilerplate (android/, ios/, etc).

> If you cloned this repo, run this inside the `app/` folder. It won't overwrite the existing `lib/` or `pubspec.yaml`.

### 3. Install dependencies

```bash
flutter pub get
```

### 4. Run on your device

Connect your phone (USB debugging on Android, or trust the Mac on iOS), then:

```bash
flutter run
```

To build a release APK for Android:

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
# Transfer to phone and install
```

### 5. Get your API credentials (inside the app)

Open the app → **Settings** tab. The step-by-step guide is built into the screen. Short version:

1. Create a Business app at developers.facebook.com
2. Add Instagram Graph API as a product
3. Generate a long-lived Page access token with these permissions:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_read_engagement`
4. Fetch your IG Business Account ID
5. Paste both values into the Settings screen and tap **Test Connection**

### 6. Add your first rule

Go to the **Rules** tab → tap **+**:

- **Rule name**: anything descriptive, e.g. "Link requests"
- **Keywords**: comma-separated words that trigger the rule, e.g. `link, where, how to get`
- **Match type**: Any (OR) is usually what you want
- **Public comment reply**: what gets posted under the comment, e.g. `Check your DMs! 📩`
- **DM reply**: the private message sent to the commenter (optional)

### 7. Start the bot

Home tab → flip the switch. The activity log shows every reply in real time.

## Notes

- The app must be open and running to poll. For true background operation on Android, look into the `workmanager` Flutter package.
- Tokens expire (~60 days for long-lived user tokens; Page tokens don't expire). If the bot starts logging auth errors, go to Settings and refresh your token.
- The DM feature requires the commenter to have previously messaged your account, or you must use Meta's "comment-to-DM" messaging window.
