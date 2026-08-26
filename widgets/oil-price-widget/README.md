# 油价小组件

这是一个严格按 Egern 小组件 DSL 编写的 `generic` 脚本，显示自选地区的 92/95/98 号汽油和 0 号柴油价格、预测价格、本次数据时间，以及下次调价时间。

## 数据源约定

脚本不内置第三方油价网站，也不会主动访问固定域名。请在 Egern 的小组件 `Env` 中配置你信任的数据接口：

- `API_URL`：必填。可使用 `{region}`、`{city}`、`{地区}` 或 `{城市}` 占位符，脚本会替换为 URL 编码后的 `REGION`。没有占位符时按原 URL 请求。
- `REGION`：自选地区，默认 `北京`。
- `API_HEADERS`：可选的 JSON 请求头对象。
- `REFRESH_MINUTES`：刷新间隔，脚本按 Egern 约束限制在 15 至 120 分钟。
- `API_TIMEOUT`：请求超时，单位毫秒，限制在 3000 至 30000。

接口返回 JSON 后，脚本会递归识别常见结构（`data`、`result`、`items` 等）和字段别名。最低要求是至少返回一个油价字段（92/95/98/0 中任意一个）；建议返回如下结构：

```json
{
  "region": "北京",
  "92": 7.67,
  "95": 8.17,
  "98": 8.92,
  "0": 7.32,
  "prediction": 7.72,
  "updatedAt": "2026-08-26T08:00:00+08:00",
  "nextAdjustAt": "2026-09-09T24:00:00+08:00"
}
```

`updatedAt` 和 `nextAdjustAt` 接受 ISO 8601 字符串或 Unix 时间戳。未提供 `nextAdjustAt` 时，脚本会以本次数据时间加 10 天作为估算，并在界面标注“估”。请求失败时会显示上一次成功结果并标注“缓存”。

## 安装

1. 在 Egern「工具 → 脚本」中新建脚本，类型选择 `generic`，名称填写 `oil-price-widget`。
2. 将 [油价小组件.js](./油价小组件.js) 的内容粘贴到脚本文件并保存。
3. 在小组件画廊新建小组件，脚本选择 `oil-price-widget`。
4. 在主配置的 `widgets` 中加入 [配置示例.yaml](./配置示例.yaml) 的内容，并按你的接口修改 `API_URL`、`REGION` 和 Env。

脚本只使用 Egern 文档列出的 `ctx.http.get`、`ctx.storage`、`ctx.widgetFamily` 和小组件 DSL 元素。

参考文档：

- [Egern 小组件](https://egernapp.com/zh-CN/docs/configuration/widgets)
- [Egern JavaScript API](https://egernapp.com/zh-CN/docs/javascript-api)
