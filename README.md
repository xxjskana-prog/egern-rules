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

## X (Twitter)

| Client | Raw URL |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X-Shadowrocket.list` |

## TestFlight

| Client | Raw URL |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight-Shadowrocket.list` |

## Oil Price Widget for Egern

The Egern `generic` widget script is organized under [`widgets/oil-price-widget`](widgets/oil-price-widget). It supports a configurable region, current 92/95/98/0 prices, prediction, update time, and next adjustment time.

| Item | URL |
| --- | --- |
| Module (raw) | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/module.yaml` |
| Script (raw) | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/oil-price-widget.js` |
| Setup guide | [`widgets/oil-price-widget/README.md`](widgets/oil-price-widget/README.md) |
| Env example | [`widgets/oil-price-widget/config.example.yaml`](widgets/oil-price-widget/config.example.yaml) |

The script does not embed or call a third-party oil-price website. Set your trusted endpoint in `API_URL` and choose the region with `REGION`.

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
