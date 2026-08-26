# 代理规则

[English](README.md) | 简体中文

个人维护的 Loon、Egern 和 Shadowrocket 规则集，以及 Egern 小组件。

## 规则列表

### Gemini

覆盖 Gemini 网页端和移动端常用接口域名。

| 客户端 | Raw 链接 |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Gemini-Shadowrocket.list` |

### WhatsApp

覆盖 WhatsApp、Meta 登录及 CDN 相关域名。

| 客户端 | Raw 链接 |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/WhatsApp-Shadowrocket.list` |

### Nagram

Nagram 是第三方 Telegram 客户端。本规则覆盖 Telegram/Nagram 常用域名、MTProto 网段、相关 CDN，以及 Nagram 官方站点。

| 客户端 | Raw 链接 |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/Nagram-Shadowrocket.list` |

### X（Twitter）

覆盖 X/Twitter 主站、API、媒体 CDN、短链和 Grok 相关域名。

| 客户端 | Raw 链接 |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/X-Shadowrocket.list` |

### TestFlight

覆盖 Apple TestFlight 相关域名。

| 客户端 | Raw 链接 |
| --- | --- |
| Loon | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight-Loon.list` |
| Egern | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight.yaml` |
| Shadowrocket | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/TestFlight-Shadowrocket.list` |

## Egern 油价小组件

小组件源码位于 [`widgets/oil-price-widget`](widgets/oil-price-widget)，支持自选地区、92/95/98 号汽油和 0 号柴油价格、下轮预测、本轮油价生效时间及下次调价时间。

| 项目 | 链接 |
| --- | --- |
| 模块安装 URL | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/module.yaml` |
| 脚本 Raw URL | `https://raw.githubusercontent.com/xxjskana-prog/egern-rules/main/widgets/oil-price-widget/oil-price-widget.js` |
| 使用说明 | [`widgets/oil-price-widget/README.md`](widgets/oil-price-widget/README.md) |
| Env 配置样例 | [`widgets/oil-price-widget/config.example.yaml`](widgets/oil-price-widget/config.example.yaml) |

当前油价及本轮生效时间来自参考小组件使用的中国石化销售接口；下轮预测和下次调价信息沿用同一参考小组件的数据页面。无需配置 API 地址或 API Key，安装模块后在 Env 中使用 `PROVINCE`、`CITY` 和可选的 `AREA_INDEX` 选择地区。

## 使用方式

Loon 和 Shadowrocket：

```ini
RULE-SET,<RAW_URL>,Proxy
```

将 `Proxy` 替换为你的代理策略组名称。

Egern：

```yaml
rules:
  - rule_set:
      match: "<RAW_URL>"
      policy: Proxy
      update_interval: 86400
```

同样需要将 `Proxy` 替换为实际的策略组名称。
