# Proxy Rules

[English](README.md) | [简体中文](README.zh-CN.md)

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

The Egern `generic` widget script is organized under [`widgets/oil-price-widget`](widgets/oil-price-widget). It supports a configurable region, current 92/95/98/0 prices, prediction, current price effective time, and next adjustment time.

| Item | URL |
| --- | --- |
| Module (raw) | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/module.yaml` |
| Script (raw) | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/oil-price-widget.js` |
| Setup guide | [`widgets/oil-price-widget/README.md`](widgets/oil-price-widget/README.md) |
| Env example | [`widgets/oil-price-widget/config.example.yaml`](widgets/oil-price-widget/config.example.yaml) |

Current prices and their effective time are loaded from the Sinopec sales interface used by the referenced GasPrice widget. Prediction and next-adjustment information follow the same widget's prediction page. No API URL or API key is required; choose a region with `PROVINCE`, `CITY`, and optional `AREA_INDEX`.

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
