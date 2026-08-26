/**
 * Egern oil price widget.
 *
 * Egern 模块 Env 填写示例：
 * 名称: PROVINCE        值: 51（必填，省份名称或行政代码）
 * 名称: CITY            值: 成都（必填，城市或显示地区）
 * 名称: AREA_INDEX      值: 0（可选，多价区索引，从 0 开始）
 * 名称: REFRESH_MINUTES 值: 30（可选，刷新间隔，单位为分钟）
 * 名称: REQUEST_TIMEOUT 值: 15000（可选，请求超时，单位为毫秒）
 *
 * Data flow adapted from:
 * https://raw.githubusercontent.com/jnlaoshu/MySelf/master/Egern/Widget/GasPrice.js
 */

const SINOPEC_BASE = 'https://cx.sinopecsales.com/yjkqiantai';
const PREDICTION_BASE = 'http://m.qiyoujiage.com';
const DEFAULT_PROVINCE = '51';
const DEFAULT_CITY = '成都';
const DEFAULT_REFRESH_MINUTES = 30;
const DEFAULT_TIMEOUT = 15000;

const PROVINCES = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江', '31': '上海', '32': '江苏',
  '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西',
  '46': '海南', '50': '重庆', '51': '四川', '52': '贵州', '53': '云南',
  '54': '西藏', '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏',
  '65': '新疆',
};

const PREDICTION_SLUGS = {
  '11': 'beijing', '12': 'tianjin', '13': 'hebei', '14': 'shanxi',
  '15': 'neimenggu', '21': 'liaoning', '22': 'jilin', '23': 'heilongjiang',
  '31': 'shanghai', '32': 'jiangsu', '33': 'zhejiang', '34': 'anhui',
  '35': 'fujian', '36': 'jiangxi', '37': 'shandong', '41': 'henan',
  '42': 'hubei', '43': 'hunan', '44': 'guangdong', '45': 'guangxi',
  '46': 'hainan', '50': 'chongqing', '51': 'sichuan', '52': 'guizhou',
  '53': 'yunnan', '54': 'xizang', '61': 'shanxi-3', '62': 'gansu',
  '63': 'qinghai', '64': 'ningxia', '65': 'xinjiang',
};

const ADJUSTMENT_CALENDAR_2026 = [
  [1, 12], [1, 23], [2, 9], [2, 23], [3, 9], [3, 23], [4, 7], [4, 21],
  [5, 8], [5, 22], [6, 5], [6, 19], [7, 3], [7, 17], [7, 31], [8, 14],
  [8, 28], [9, 11], [9, 25], [10, 14], [10, 28], [11, 11], [11, 25],
  [12, 9], [12, 23],
];

const COMMON_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  Referer: `${SINOPEC_BASE}/index.html`,
  Origin: 'https://cx.sinopecsales.com',
};

const COLORS = {
  // Egern 文档支持 rgba() 颜色；价格单元使用半透明层叠在系统材质之上。
  surface: { light: 'rgba(255,255,255,0.42)', dark: 'rgba(37,40,44,0.48)' },
  primary: { light: '#17212B', dark: '#F2F4F7' },
  secondary: { light: '#5C6670', dark: '#A9B2BC' },
  accent: { light: '#0A84FF', dark: '#64B5FF' },
  up: { light: '#C62828', dark: '#FF6B6B' },
  down: { light: '#16834B', dark: '#59D18A' },
  warning: { light: '#B46900', dark: '#FFB84D' },
  error: { light: '#C62828', dark: '#FF7B7B' },
};

function getEnv(ctx, names, fallback) {
  const env = (ctx && ctx.env) || {};
  for (let index = 0; index < names.length; index += 1) {
    const value = env[names[index]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeProvince(value) {
  const raw = String(value || '').trim();
  if (PROVINCES[raw]) return raw;
  const cleaned = raw.replace(/省|市|自治区|壮族|回族|维吾尔/g, '');
  const match = Object.keys(PROVINCES).find((code) => {
    const name = PROVINCES[code];
    return name === cleaned || name.includes(cleaned) || cleaned.includes(name);
  });
  return match || DEFAULT_PROVINCE;
}

function parseSetCookie(headers) {
  let values = [];
  if (headers && headers.getAll) {
    try {
      values = headers.getAll('set-cookie') || [];
    } catch (_) {
      values = [];
    }
  }
  if (!values.length && headers && headers.get) {
    try {
      const value = headers.get('set-cookie');
      if (value) values = Array.isArray(value) ? value : [value];
    } catch (_) {
      values = [];
    }
  }
  return values
    .reduce((result, value) => result.concat(String(value).split(/,\s*(?=[A-Za-z0-9_]+=)/)), [])
    .map((value) => value.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function readJSONResponse(response, label) {
  if (!response || response.status < 200 || response.status >= 300) {
    throw new Error(`${label} HTTP ${response ? response.status : '请求失败'}`);
  }
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch (_) {
    throw new Error(`${label}返回格式异常`);
  }
}

function resolveAreaIndex(payload, city, explicitIndex) {
  const data = payload.data || payload;
  const areas = Array.isArray(data.area) ? data.area : [];
  if (!areas.length) return 0;
  if (explicitIndex !== null) return clamp(Math.round(explicitIndex), 0, areas.length - 1);
  if (!city) return 0;
  const wanted = String(city).trim();
  const index = areas.findIndex((area) => {
    const check = area.areaCheck || {};
    const name = check.AREA_NAME || check.CITY_NAME || check.PROVINCE_NAME || area.areaName || '';
    return name && (String(name).includes(wanted) || wanted.includes(String(name)));
  });
  return index >= 0 ? index : 0;
}

function fuelValue(check, priceData, rawKey, priceKey) {
  if (check && check[rawKey] !== 'Y') return null;
  const value = Number(priceData && priceData[priceKey]);
  return Number.isFinite(value) ? value : null;
}

function fuelDelta(priceData, priceKey) {
  const value = Number(priceData && priceData[`${priceKey}_STATUS`]);
  return Number.isFinite(value) ? value : null;
}

function parseSinopecDate(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(' ', 'T');
  const withZone = /(?:Z|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}+08:00`;
  const date = new Date(withZone);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractCurrentData(payload, provinceCode, city, explicitIndex) {
  const data = payload.data || payload;
  const areas = Array.isArray(data.area) ? data.area : [];
  const areaIndex = resolveAreaIndex(payload, city, explicitIndex);
  const selected = areas.length ? areas[areaIndex] : null;
  const check = (selected && selected.areaCheck) || data.provinceCheck || {};
  const priceData = (selected && selected.areaData) || data.provinceData || {};
  const provinceName = check.PROVINCE_NAME || PROVINCES[provinceCode];
  const areaName = check.AREA_NAME || check.CITY_NAME || (selected && selected.areaName) || '';
  const displayRegion = city || areaName || provinceName;

  let gasoline98 = fuelValue(check, priceData, 'GAS_98', 'GAS_98');
  let gasoline98Delta = fuelDelta(priceData, 'GAS_98');
  if (gasoline98 === null) {
    gasoline98 = fuelValue(check, priceData, 'AIPAO98', 'AIPAO_GAS_98');
    gasoline98Delta = fuelDelta(priceData, 'AIPAO_GAS_98');
  }

  const result = {
    provinceCode,
    provinceName,
    city,
    areaName,
    areaIndex,
    region: displayRegion,
    gasoline92: fuelValue(check, priceData, 'GAS_92', 'GAS_92'),
    gasoline95: fuelValue(check, priceData, 'GAS_95', 'GAS_95'),
    gasoline98,
    diesel: fuelValue(check, priceData, 'CHAI_0', 'CHECHAI_0'),
    deltas: {
      gasoline92: fuelDelta(priceData, 'GAS_92'),
      gasoline95: fuelDelta(priceData, 'GAS_95'),
      gasoline98: gasoline98Delta,
      diesel: fuelDelta(priceData, 'CHECHAI_0'),
    },
    effectiveAt: parseSinopecDate(priceData.START_DATE),
  };

  if ([result.gasoline92, result.gasoline95, result.gasoline98, result.diesel].every((value) => value === null)) {
    throw new Error('中国石化接口未返回可用油价');
  }
  return result;
}

async function loadCurrentPrices(ctx, provinceCode, city, explicitIndex, timeout) {
  const initResponse = await ctx.http.get(`${SINOPEC_BASE}/data/initMainData`, {
    headers: COMMON_HEADERS,
    credentials: 'include',
    timeout,
  });
  await readJSONResponse(initResponse, '初始化接口');
  const cookie = parseSetCookie(initResponse.headers);
  const headers = Object.assign({}, COMMON_HEADERS, { 'Content-Type': 'application/json;charset=UTF-8' });
  if (cookie) headers.Cookie = cookie;

  const response = await ctx.http.post(`${SINOPEC_BASE}/data/switchProvince`, {
    headers,
    body: { provinceId: String(provinceCode) },
    credentials: 'include',
    timeout,
  });
  const payload = await readJSONResponse(response, '油价接口');
  return extractCurrentData(payload, provinceCode, city, explicitIndex);
}

function nextAdjustmentFromCalendar(now) {
  if (now.getFullYear() !== 2026) return null;
  for (let index = 0; index < ADJUSTMENT_CALENDAR_2026.length; index += 1) {
    const item = ADJUSTMENT_CALENDAR_2026[index];
    const effective = new Date(2026, item[0] - 1, item[1] + 1, 0, 0, 0);
    if (effective.getTime() > now.getTime()) {
      return {
        iso: effective.toISOString(),
        label: `${item[0]}月${item[1]}日 24:00`,
        source: 'calendar',
      };
    }
  }
  return null;
}

function parseNextAdjustment(html, now) {
  const match = html.match(/下次油价\s*(\d{1,2})月(\d{1,2})日\s*24时调整/);
  if (!match) return nextAdjustmentFromCalendar(now);
  const month = Number(match[1]);
  const day = Number(match[2]);
  let year = now.getFullYear();
  let effective = new Date(year, month - 1, day + 1, 0, 0, 0);
  if (effective.getTime() <= now.getTime() - 24 * 60 * 60 * 1000) {
    year += 1;
    effective = new Date(year, month - 1, day + 1, 0, 0, 0);
  }
  return {
    iso: effective.toISOString(),
    label: `${month}月${day}日 24:00`,
    source: 'page',
  };
}

function parsePrediction(html) {
  let match = html.match(/预计(上调|下调)(?:油价)?[\d.]+元\/吨\((\d+(?:\.\d+)?)元\/升-(\d+(?:\.\d+)?)元\/升\)/);
  if (!match) match = html.match(/(上涨|上调|下调|下跌)(\d+(?:\.\d+)?)元\/升-(\d+(?:\.\d+)?)元\/升/);
  if (!match) return null;
  const minimum = Number(match[2]);
  const maximum = Number(match[3]);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return null;
  return {
    direction: match[1] === '上调' || match[1] === '上涨' ? 'up' : 'down',
    minimum,
    maximum,
  };
}

async function loadPrediction(ctx, provinceCode, timeout) {
  const slug = PREDICTION_SLUGS[provinceCode];
  if (!slug) return { prediction: null, nextAdjustment: nextAdjustmentFromCalendar(new Date()) };
  const response = await ctx.http.get(`${PREDICTION_BASE}/${slug}.shtml`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,*/*',
      'User-Agent': COMMON_HEADERS['User-Agent'],
    },
    credentials: 'omit',
    timeout,
  });
  if (!response || response.status < 200 || response.status >= 300) {
    throw new Error(`预测页面 HTTP ${response ? response.status : '请求失败'}`);
  }
  const html = await response.text();
  return {
    prediction: parsePrediction(html),
    nextAdjustment: parseNextAdjustment(html, new Date()),
  };
}

function cacheKey(provinceCode, city, explicitIndex) {
  return `oil-price-widget:${provinceCode}:${city || ''}:${explicitIndex === null ? '' : explicitIndex}`;
}

function getCache(ctx, key) {
  try {
    return ctx.storage ? ctx.storage.getJSON(key) : null;
  } catch (_) {
    return null;
  }
}

function setCache(ctx, key, value) {
  try {
    if (ctx.storage) ctx.storage.setJSON(key, value);
  } catch (_) {
    // Rendering current data is more important than persisting it.
  }
}

function pad2(value) {
  return value < 10 ? `0${value}` : String(value);
}

function formatDateTime(iso) {
  if (!iso) return '未提供';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '未提供';
  return `${date.getMonth() + 1}月${date.getDate()}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function priceText(value) {
  return value === null || value === undefined ? '--' : Number(value).toFixed(2);
}

function predictionText(prediction) {
  if (!prediction) return '暂无预测';
  const range = prediction.minimum === prediction.maximum
    ? prediction.minimum.toFixed(2)
    : `${prediction.minimum.toFixed(2)}-${prediction.maximum.toFixed(2)}`;
  return `${prediction.direction === 'up' ? '预计上调' : '预计下调'} ${range}`;
}

function predictionColor(prediction) {
  if (!prediction) return COLORS.secondary;
  return prediction.direction === 'up' ? COLORS.up : COLORS.down;
}

function text(value, font, textColor, extra) {
  return Object.assign({ type: 'text', text: String(value), font, textColor }, extra || {});
}

function row(children, extra) {
  return Object.assign({ type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children }, extra || {});
}

function column(children, extra) {
  return Object.assign({ type: 'stack', direction: 'column', alignItems: 'start', gap: 4, children }, extra || {});
}

function priceRow(label, value, delta) {
  let deltaText = '';
  let deltaColor = COLORS.secondary;
  if (delta !== null && delta !== undefined && delta !== 0) {
    deltaText = `${delta > 0 ? '+' : ''}${Number(delta).toFixed(2)}`;
    deltaColor = delta > 0 ? COLORS.up : COLORS.down;
  }
  return row([
    text(label, { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
    { type: 'spacer' },
    deltaText ? text(deltaText, { size: 'caption2', weight: 'semibold' }, deltaColor, { maxLines: 1 }) : { type: 'spacer', length: 2 },
    text(`${priceText(value)} 元/L`, { size: 'caption1', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.65, textAlign: 'right' }),
  ]);
}

function header(data) {
  const subtitle = data.stale ? '缓存数据' : `${data.provinceName}${data.areaName ? ` · ${data.areaName}` : ''}`;
  return row([
    { type: 'image', src: 'sf-symbol:fuelpump.fill', width: 18, height: 18, color: COLORS.accent },
    column([
      text(`${data.region}油价`, { size: 'headline', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.65 }),
      text(subtitle, { size: 'caption2', weight: 'medium' }, data.stale ? COLORS.warning : COLORS.secondary, { maxLines: 1, minScale: 0.65 }),
    ], { gap: 1 }),
  ], { gap: 7 });
}

function adjustmentBlock(data) {
  const adjustment = data.nextAdjustment;
  return column([
    row([
      text('下次调价', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
      { type: 'spacer' },
      text(adjustment ? adjustment.label : '待公布', { size: 'caption2', weight: 'semibold' }, adjustment ? COLORS.primary : COLORS.secondary, { maxLines: 1, minScale: 0.55, textAlign: 'right' }),
    ]),
    adjustment
      ? { type: 'date', date: adjustment.iso, format: 'relative', font: { size: 'caption2', weight: 'medium' }, textColor: COLORS.accent, maxLines: 1, minScale: 0.7 }
      : text('暂无调整时间', { size: 'caption2' }, COLORS.secondary, { maxLines: 1 }),
  ], { gap: 2 });
}

function buildAccessoryWidget(data, family, refreshAfter) {
  if (family === 'accessoryInline') {
    return {
      type: 'widget',
      children: [text(`${data.region} 92号 ${priceText(data.gasoline92)} · ${predictionText(data.prediction)}`, { size: 'caption1', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.45 })],
      padding: 2,
      refreshAfter,
      url: SINOPEC_BASE,
    };
  }
  if (family === 'accessoryCircular') {
    return {
      type: 'widget',
      children: [
        text(data.region, { size: 'caption2', weight: 'semibold' }, COLORS.secondary, { maxLines: 1, minScale: 0.55, textAlign: 'center' }),
        text(priceText(data.gasoline92), { size: 'title3', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.5, textAlign: 'center' }),
        text(data.prediction ? (data.prediction.direction === 'up' ? '预测涨' : '预测跌') : '暂无预测', { size: 'caption2', weight: 'medium' }, predictionColor(data.prediction), { maxLines: 1, minScale: 0.5, textAlign: 'center' }),
      ],
      gap: 2,
      padding: 5,
      refreshAfter,
      url: SINOPEC_BASE,
    };
  }
  return {
    type: 'widget',
    children: [
      row([
        text(data.region, { size: 'caption1', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.6 }),
        { type: 'spacer' },
        text(`92 ${priceText(data.gasoline92)}`, { size: 'caption1', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.55, textAlign: 'right' }),
      ]),
      text(`${predictionText(data.prediction)} · ${data.nextAdjustment ? data.nextAdjustment.label : '调价待公布'}`, { size: 'caption2', weight: 'medium' }, predictionColor(data.prediction), { maxLines: 1, minScale: 0.45 }),
    ],
    gap: 3,
    padding: 5,
    refreshAfter,
    url: SINOPEC_BASE,
  };
}

function mediumDelta(delta) {
  if (delta === null || delta === undefined || !Number.isFinite(Number(delta))) {
    return { value: '--', color: COLORS.secondary };
  }
  const number = Number(delta);
  if (number === 0) return { value: '持平', color: COLORS.secondary };
  return {
    value: `${number > 0 ? '+' : ''}${number.toFixed(2)}`,
    color: number > 0 ? COLORS.up : COLORS.down,
  };
}

function mediumPriceCell(label, value, delta) {
  const change = mediumDelta(delta);
  return column([
    text(label, { size: 10, weight: 'semibold' }, COLORS.secondary, { maxLines: 1, minScale: 0.7, textAlign: 'center' }),
    text(priceText(value), { size: 16, weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.55, textAlign: 'center' }),
    text(change.value, { size: 9, weight: 'semibold' }, change.color, { maxLines: 1, minScale: 0.65, textAlign: 'center' }),
  ], {
    alignItems: 'center',
    gap: 1,
    flex: 1,
    height: 58,
    padding: [5, 2, 4, 2],
    borderRadius: 6,
    backgroundColor: COLORS.surface,
  });
}

function buildMediumWidget(data, refreshAfter) {
  const subtitle = data.stale ? '缓存数据' : `${data.provinceName}${data.areaName ? ` · ${data.areaName}` : ''}`;
  const prediction = data.prediction;
  const predictionLabel = prediction
    ? (prediction.direction === 'up' ? '预测上调' : '预测下调')
    : '下轮预测';
  const predictionValue = prediction
    ? `${prediction.minimum.toFixed(2)}-${prediction.maximum.toFixed(2)} 元/L`
    : '暂无预测';
  const adjustmentValue = data.nextAdjustment ? data.nextAdjustment.label : '待公布';

  return {
    type: 'widget',
    children: [
      row([
        { type: 'image', src: 'sf-symbol:fuelpump.fill', width: 16, height: 16, color: COLORS.accent },
        column([
          text(`${data.region}油价`, { size: 15, weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.65 }),
          text(subtitle, { size: 10, weight: 'medium' }, data.stale ? COLORS.warning : COLORS.secondary, { maxLines: 1, minScale: 0.65 }),
        ], { gap: 0 }),
        { type: 'spacer' },
        column([
          text('本轮生效', { size: 9, weight: 'medium' }, COLORS.secondary, { maxLines: 1, textAlign: 'right' }),
          text(formatDateTime(data.effectiveAt), { size: 10, weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.6, textAlign: 'right' }),
        ], { gap: 0, alignItems: 'end' }),
      ], { gap: 6 }),
      row([
        mediumPriceCell('92号', data.gasoline92, data.deltas.gasoline92),
        mediumPriceCell('95号', data.gasoline95, data.deltas.gasoline95),
        mediumPriceCell('98号', data.gasoline98, data.deltas.gasoline98),
        mediumPriceCell('柴油', data.diesel, data.deltas.diesel),
      ], { gap: 5, height: 58 }),
      row([
        column([
          text(predictionLabel, { size: 9, weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
          text(predictionValue, { size: 11, weight: 'semibold' }, predictionColor(prediction), { maxLines: 1, minScale: 0.55 }),
        ], { gap: 1, flex: 1 }),
        column([
          text('下次调价', { size: 9, weight: 'medium' }, COLORS.secondary, { maxLines: 1, textAlign: 'right' }),
          text(adjustmentValue, { size: 11, weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.55, textAlign: 'right' }),
        ], { gap: 1, flex: 1, alignItems: 'end' }),
      ], { gap: 8, alignItems: 'end' }),
    ],
    gap: 6,
    padding: [10, 12, 8, 12],
    refreshAfter,
    url: SINOPEC_BASE,
  };
}

function buildWidget(data, family, refreshAfter) {
  if (family.indexOf('accessory') === 0) return buildAccessoryWidget(data, family, refreshAfter);
  if (family === 'systemMedium') return buildMediumWidget(data, refreshAfter);
  const small = family === 'systemSmall';
  const large = family === 'systemLarge' || family === 'systemExtraLarge';
  const children = [header(data)];

  children.push(row([
    column([
      text('92号汽油', { size: small ? 'caption2' : 'caption1', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
      text(`${priceText(data.gasoline92)} 元/L`, { size: large ? 'largeTitle' : 'title2', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.5 }),
    ], { gap: 1 }),
    { type: 'spacer' },
    column([
      text('下轮预测', { size: small ? 'caption2' : 'caption1', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
      text(predictionText(data.prediction), { size: small ? 'caption1' : 'title3', weight: 'semibold' }, predictionColor(data.prediction), { maxLines: small ? 2 : 1, minScale: 0.5, textAlign: 'right' }),
      data.prediction ? text('元/L', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1, textAlign: 'right' }) : { type: 'spacer', length: 1 },
    ], { gap: 1, alignItems: 'end' }),
  ], { alignItems: 'end', gap: 8 }));

  if (!small) {
    children.push(column([
      priceRow('95号汽油', data.gasoline95, data.deltas.gasoline95),
      priceRow('98号汽油', data.gasoline98, data.deltas.gasoline98),
      priceRow('0号柴油', data.diesel, data.deltas.diesel),
    ], { gap: 5 }));
  }

  children.push(row([
    text('本轮生效', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
    { type: 'spacer' },
    text(formatDateTime(data.effectiveAt), { size: 'caption2', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.6, textAlign: 'right' }),
  ]));
  children.push(adjustmentBlock(data));

  return {
    type: 'widget',
    children,
    gap: large ? 10 : 8,
    padding: small ? 12 : 14,
    refreshAfter,
    url: SINOPEC_BASE,
  };
}

function errorWidget(message, refreshAfter) {
  return {
    type: 'widget',
    children: [
      row([
        { type: 'image', src: 'sf-symbol:exclamationmark.triangle.fill', width: 18, height: 18, color: COLORS.error },
        text('油价小组件', { size: 'headline', weight: 'bold' }, COLORS.primary, { maxLines: 1 }),
      ]),
      text(message, { size: 'caption1', weight: 'medium' }, COLORS.error, { maxLines: 5, minScale: 0.65 }),
      text('请检查网络或地区配置', { size: 'caption2' }, COLORS.secondary, { maxLines: 2 }),
    ],
    gap: 8,
    padding: 14,
    refreshAfter,
    url: SINOPEC_BASE,
  };
}

export default async function (ctx) {
  const provinceInput = getEnv(ctx, ['PROVINCE', 'PROVINCE_ID', 'province'], DEFAULT_PROVINCE);
  const provinceCode = normalizeProvince(provinceInput);
  const city = getEnv(ctx, ['CITY', 'city'], provinceCode === DEFAULT_PROVINCE ? DEFAULT_CITY : '');
  const areaRaw = getEnv(ctx, ['AREA_INDEX', 'AREA', 'area'], '');
  const explicitIndex = areaRaw === '' ? null : parseNumber(areaRaw, null);
  const refreshMinutes = clamp(Math.round(parseNumber(getEnv(ctx, ['REFRESH_MINUTES'], DEFAULT_REFRESH_MINUTES)), 15), 15, 120);
  const timeout = clamp(Math.round(parseNumber(getEnv(ctx, ['REQUEST_TIMEOUT'], DEFAULT_TIMEOUT)), DEFAULT_TIMEOUT), 3000, 30000);
  const refreshAfter = new Date(Date.now() + refreshMinutes * 60 * 1000).toISOString();
  const family = ctx && ctx.widgetFamily ? ctx.widgetFamily : 'systemMedium';
  const key = cacheKey(provinceCode, city, explicitIndex);
  const cached = getCache(ctx, key);

  let data;
  try {
    data = await loadCurrentPrices(ctx, provinceCode, city, explicitIndex, timeout);
    try {
      const forecast = await loadPrediction(ctx, provinceCode, Math.min(timeout, 10000));
      data.prediction = forecast.prediction || (cached && cached.prediction) || null;
      data.nextAdjustment = forecast.nextAdjustment || (cached && cached.nextAdjustment) || nextAdjustmentFromCalendar(new Date());
    } catch (_) {
      data.prediction = (cached && cached.prediction) || null;
      data.nextAdjustment = (cached && cached.nextAdjustment) || nextAdjustmentFromCalendar(new Date());
    }
    data.fetchedAt = new Date().toISOString();
    data.stale = false;
    setCache(ctx, key, data);
  } catch (error) {
    if (!cached) {
      const message = error && error.message ? error.message : '暂时无法获取油价';
      return errorWidget(message, refreshAfter);
    }
    data = cached;
    data.stale = true;
  }

  return buildWidget(data, family, refreshAfter);
}
