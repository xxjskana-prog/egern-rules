# Proxy Rules

Personal rule sets for Loon, Egern, and Shadowrocket.

## Gemini

| Client | Raw URL |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Shadowrocket.list` |

## WhatsApp

| Client | Raw URL |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Shadowrocket.list` |

## Nagram

Nagram is a third-party Telegram client. These rules cover Nagram's Telegram endpoints, MTProto IP ranges, Telegram-related CDN domains, and the Nagram official site.

| Client | Raw URL |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram-Shadowrocket.list` |

## Usage

Loon and Shadowrocket rule-set example:

```ini
RULE-SET,<RAW_URL>,Proxy
```

Egern rule-set example:

```yaml
rules:
  - rule_set:
      match: "<RAW_URL>"
      policy: Proxy
      update_interval: 86400
```
