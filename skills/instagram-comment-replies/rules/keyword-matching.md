# Keyword Matching

## Basic rule structure

```typescript
interface ReplyRule {
  id: string;
  keywords: string[];
  matchType: 'any' | 'all' | 'exact';
  caseSensitive?: boolean;
  commentReply?: string;
  dmReply?: string;
}
```

## Match types

| Type | Behavior |
|------|----------|
| `any` | Comment contains at least one keyword (OR) |
| `all` | Comment contains every keyword (AND) |
| `exact` | Comment text matches keyword exactly |

```typescript
function matchesRule(text: string, rule: ReplyRule): boolean {
  const normalize = (s: string) =>
    rule.caseSensitive ? s : s.toLowerCase();

  const haystack = normalize(text);
  const needles = rule.keywords.map(normalize);

  switch (rule.matchType) {
    case 'any':
      return needles.some((kw) => haystack.includes(kw));
    case 'all':
      return needles.every((kw) => haystack.includes(kw));
    case 'exact':
      return needles.some((kw) => haystack.trim() === kw.trim());
  }
}
```

## Personalized replies with placeholders

Use `{{username}}` in reply templates to personalize at send time:

```typescript
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// Usage
const reply = interpolate(rule.commentReply!, { username: comment.from.username });
// "Hey @john_doe, check your DMs! 📩"
```

## Rule priority

Evaluate rules in order; stop at the first match:

```typescript
function findMatchingRule(text: string, rules: ReplyRule[]): ReplyRule | null {
  for (const rule of rules) {
    if (matchesRule(text, rule)) return rule;
  }
  return null;
}
```

## Storing rules

For a simple setup, keep rules in a JSON config file:

```json
[
  {
    "id": "link-request",
    "keywords": ["link", "where", "how to get"],
    "matchType": "any",
    "commentReply": "Sending you the details now! 📬",
    "dmReply": "Hey! Here's the link: https://example.com"
  },
  {
    "id": "price-inquiry",
    "keywords": ["price", "cost", "how much", "pricing"],
    "matchType": "any",
    "commentReply": "Sent you our pricing info! 💰",
    "dmReply": "Hi! Pricing starts at $29/mo — see https://example.com/pricing"
  }
]
```

Load and hot-reload without restart:

```typescript
import fs from 'fs';

let rules: ReplyRule[] = JSON.parse(fs.readFileSync('rules.json', 'utf8'));

fs.watch('rules.json', () => {
  try {
    rules = JSON.parse(fs.readFileSync('rules.json', 'utf8'));
    console.log('Rules reloaded');
  } catch (e) {
    console.error('Failed to reload rules', e);
  }
});
```
