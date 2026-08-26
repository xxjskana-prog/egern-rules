# 油价小组件

这是一个严格按 Egern 小组件 DSL 编写的 `generic` 脚本，显示自选地区的 92/95/98 号汽油和 0 号柴油价格、下轮预测、本轮油价生效时间，以及下次调价时间。

## 数据来源

- 当前油价与本轮生效时间：中国石化销售页面接口 `https://cx.sinopecsales.com/yjkqiantai`。
- 下轮涨跌预测和下次调价日期：沿用参考小组件的汽油价格网页面 `http://m.qiyoujiage.com`。
- 接口实现参考：[jnlaoshu/MySelf GasPrice.js](https://raw.githubusercontent.com/jnlaoshu/MySelf/master/Egern/Widget/GasPrice.js)。

用户不需要提供 API 地址或 API Key。当前价格请求失败时，小组件会显示同一地区上一次成功缓存的数据。

## 环境变量

- `PROVINCE`：省份名称或行政代码，默认 `51`（四川）。例如 `上海` 或 `31`。
- `CITY`：城市或显示地区，默认 `成都`。接口提供城市分区时也用于匹配区域。
- `AREA_INDEX`：可选。部分省份存在多个价区，从 `0` 开始选择；未填写时自动匹配或使用第一个价区。
- `REFRESH_MINUTES`：刷新间隔，默认 30 分钟，限制在 15 至 120 分钟。
- `REQUEST_TIMEOUT`：请求超时，默认 15000 毫秒，限制在 3000 至 30000 毫秒。

支持的省份代码：

```text
11 北京  12 天津  13 河北  14 山西  15 内蒙古
21 辽宁  22 吉林  23 黑龙江 31 上海  32 江苏
33 浙江  34 安徽  35 福建  36 江西  37 山东
41 河南  42 湖北  43 湖南  44 广东  45 广西
46 海南  50 重庆  51 四川  52 贵州  53 云南
54 西藏  61 陕西  62 甘肃  63 青海  64 宁夏  65 新疆
```

## 安装

推荐直接将 [module.yaml](./module.yaml) 的 Raw URL 添加到 Egern「工具 → 模块」，模块会自动注册脚本和小组件。安装后在模块 Env 中设置 `PROVINCE`、`CITY` 等参数。

也可以手动导入 [oil-price-widget.js](./oil-price-widget.js)，并参考 [config.example.yaml](./config.example.yaml) 配置。

脚本只使用 Egern 文档列出的 `ctx.http.get`、`ctx.http.post`、`ctx.storage`、`ctx.widgetFamily` 和小组件 DSL 元素。

参考文档：

- [Egern 小组件](https://egernapp.com/zh-CN/docs/configuration/widgets)
- [Egern JavaScript API](https://egernapp.com/zh-CN/docs/javascript-api)
