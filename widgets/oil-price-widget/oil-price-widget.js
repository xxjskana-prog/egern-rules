const CACHE_KEY = 'oil-price-widget:last-data';
const DEFAULT_REGION = '北京';
const DEFAULT_REFRESH_MINUTES = 30;
const DEFAULT_TIMEOUT = 10000;

const COLORS = {
  background: { light: '#F5F7FA', dark: '#17191C' },
  primary: { light: '#17212B', dark: '#F2F4F7' },
  secondary: { light: '#5C6670', dark: '#A9B2BC' },
  accent: { light: '#0A84FF', dark: '#64B5FF' },
  positive: { light: '#16834B', dark: '#59D18A' },
  warning: { light: '#B46900', dark: '#FFB84D' },
  divider: { light: '#D9DEE5', dark: '#353A40' },
  error: { light: '#C62828', dark: '#FF7B7B' },
};

function getEnv(ctx, key, fallback) {
  if (!ctx || !ctx.env) return fallback;
  const value = ctx.env[key];
  return value === undefined || value === null || String(value).trim() === ''
    ? fallback
    : String(value).trim();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseRefreshMinutes(value) {
  const minutes = Number(value);
  return Number.isFinite(minutes) ? clamp(Math.round(minutes), 15, 120) : DEFAULT_REFRESH_MINUTES;
}

function parseTimeout(value) {
  const timeout = Number(value);
  return Number.isFinite(timeout) ? clamp(Math.round(timeout), 3000, 30000) : DEFAULT_TIMEOUT;
}

function buildApiUrl(template, region) {
  const encodedRegion = encodeURIComponent(region);
  return String(template)
    .replace(/\{region\}/gi, encodedRegion)
    .replace(/\{city\}/gi, encodedRegion)
    .replace(/\{地区\}/g, encodedRegion)
    .replace(/\{城市\}/g, encodedRegion);
}

function parseHeaders(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const headers = {};
    Object.keys(parsed).forEach((key) => {
      const value = parsed[key];
      if (Array.isArray(value)) headers[key] = value.map((item) => String(item));
      else if (value !== undefined && value !== null) headers[key] = String(value);
    });
    return headers;
  } catch (_) {
    return {};
  }
}

function normalizeKey(value) {
  return String(value).toLowerCase().replace(/[\s_\-#号]/g, '');
}

function stringValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function hasPriceLike(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).some((key) => {
    const normalized = normalizeKey(key);
    return normalized === '92' || normalized === '95' || normalized === '98' ||
      normalized === '0' || normalized.includes('price92') || normalized.includes('gas92') ||
      normalized.includes('汽油92') || normalized.includes('柴油');
  });
}

function containsPriceLike(value, depth) {
  if (depth > 5 || value === null || value === undefined) return false;
  if (hasPriceLike(value)) return true;
  if (Array.isArray(value)) return value.some((item) => containsPriceLike(item, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.keys(value).some((key) => containsPriceLike(value[key], depth + 1));
}

function regionText(value) {
  return stringValue(value).replace(/[省市县区]$/, '');
}

function regionMatches(value, region) {
  const candidate = regionText(value);
  const wanted = regionText(region);
  if (!candidate || !wanted) return false;
  return candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate);
}

function findExactRegionRecord(value, region, depth) {
  if (depth > 5 || value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const match = findExactRegionRecord(value[index], region, depth + 1);
      if (match) return match;
    }
    return null;
  }
  if (typeof value !== 'object') return null;

  const regionKeys = ['region', 'city', 'province', 'area', 'name', '地区', '城市', '省份', '名称'];
  for (let index = 0; index < regionKeys.length; index += 1) {
    if (regionMatches(value[regionKeys[index]], region) && containsPriceLike(value, 0)) return value;
  }
  const keys = Object.keys(value);
  for (let index = 0; index < keys.length; index += 1) {
    if (regionMatches(keys[index], region) && value[keys[index]] && typeof value[keys[index]] === 'object' && containsPriceLike(value[keys[index]], 0)) {
      return value[keys[index]];
    }
  }
  for (let index = 0; index < keys.length; index += 1) {
    const child = value[keys[index]];
    if (child && typeof child === 'object') {
      const match = findExactRegionRecord(child, region, depth + 1);
      if (match) return match;
    }
  }
  return null;
}

function findRegionRecord(value, region, depth) {
  if (depth > 5 || value === null || value === undefined) return null;
  if (depth === 0) {
    const exact = findExactRegionRecord(value, region, 0);
    if (exact) return exact;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const match = findRegionRecord(value[index], region, depth + 1);
      if (match) return match;
    }
    return value.length > 0 ? value[0] : null;
  }
  if (typeof value !== 'object') return null;

  const regionKeys = ['region', 'city', 'province', 'area', 'name', '地区', '城市', '省份', '名称'];
  for (let index = 0; index < regionKeys.length; index += 1) {
    const key = regionKeys[index];
    if (regionMatches(value[key], region)) return value;
  }
  const keys = Object.keys(value);
  for (let index = 0; index < keys.length; index += 1) {
    if (regionMatches(keys[index], region) && value[keys[index]] && typeof value[keys[index]] === 'object') {
      return value[keys[index]];
    }
  }
  if (hasPriceLike(value)) return value;

  const preferred = ['data', 'result', 'results', 'items', 'list', 'records', 'payload'];
  for (let index = 0; index < preferred.length; index += 1) {
    const child = value[preferred[index]];
    if (child !== undefined) {
      const match = findRegionRecord(child, region, depth + 1);
      if (match) return match;
    }
  }
  for (let index = 0; index < keys.length; index += 1) {
    const child = value[keys[index]];
    if (child && typeof child === 'object') {
      const match = findRegionRecord(child, region, depth + 1);
      if (match) return match;
    }
  }
  return null;
}

function findField(value, aliases, depth) {
  if (depth > 4 || value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const match = findField(value[index], aliases, depth + 1);
      if (match !== undefined) return match;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;

  const keys = Object.keys(value);
  for (let aliasIndex = 0; aliasIndex < aliases.length; aliasIndex += 1) {
    const alias = normalizeKey(aliases[aliasIndex]);
    for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
      const normalized = normalizeKey(keys[keyIndex]);
      if (normalized === alias || normalized.includes(alias)) return value[keys[keyIndex]];
    }
  }
  const preferred = ['data', 'result', 'results', 'prices', 'price', 'forecast', 'prediction'];
  for (let index = 0; index < preferred.length; index += 1) {
    if (value[preferred[index]] !== undefined) {
      const match = findField(value[preferred[index]], aliases, depth + 1);
      if (match !== undefined) return match;
    }
  }
  for (let index = 0; index < keys.length; index += 1) {
    const child = value[keys[index]];
    if (child && typeof child === 'object') {
      const match = findField(child, aliases, depth + 1);
      if (match !== undefined) return match;
    }
  }
  return undefined;
}

function parsePrice(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') {
    const nested = findField(value, ['price', 'value', 'amount', '价格', '售价'], 0);
    return nested === undefined ? null : parsePrice(nested);
  }
  const text = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!text) return null;
  const number = Number(text[0]);
  return Number.isFinite(number) ? number : null;
}

function parsePrediction(record) {
  const direct = findField(record, ['prediction92', 'predicted92', 'forecast92', '预测92', '预测价92'], 0);
  const generic = direct === undefined
    ? findField(record, ['prediction', 'predicted', 'forecast', 'nextprice', 'next_price', '预测', '预测价', '预测价格'], 0)
    : direct;
    if (generic && typeof generic === 'object') {
      const nested = findField(generic, ['92', 'price92', '汽油92', '92号汽油'], 0);
      return parsePrice(nested === undefined ? generic : nested);
    }
  return parsePrice(generic);
}

function toIso(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const number = Number(value);
    const millis = number < 100000000000 ? number * 1000 : number;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

function displayPrice(value) {
  return value === null || value === undefined ? '--' : Number(value).toFixed(2);
}

function normalizePayload(payload, region) {
  const record = findRegionRecord(payload, region, 0);
  if (!record || typeof record !== 'object') throw new Error('API 返回中没有可识别的数据');

  const resolvedRegion = stringValue(
    findField(record, ['region', 'city', 'province', 'area', '地区', '城市', '省份'], 0),
  ) || region;
  const current = {
    region: resolvedRegion,
    gasoline92: parsePrice(findField(record, ['gasoline92', 'price92', 'petrol92', '92号汽油', '汽油92', '92'], 0)),
    gasoline95: parsePrice(findField(record, ['gasoline95', 'price95', 'petrol95', '95号汽油', '汽油95', '95'], 0)),
    gasoline98: parsePrice(findField(record, ['gasoline98', 'price98', 'petrol98', '98号汽油', '汽油98', '98'], 0)),
    diesel: parsePrice(findField(record, ['diesel', 'price0', 'diesel0', '0号柴油', '柴油', '0'], 0)),
    prediction: parsePrediction(record),
    updatedAt: toIso(findField(record, ['updatedAt', 'updateTime', 'updated', 'time', 'date', '更新时间', '发布时间'], 0)),
    nextAdjustAt: toIso(findField(record, ['nextAdjustAt', 'nextAdjustment', 'next_adjustment_time', 'nextDate', '下次调价时间', '下次调整时间'], 0)),
  };

  if (current.gasoline92 === null && current.gasoline95 === null && current.gasoline98 === null && current.diesel === null) {
    throw new Error('API 返回中没有识别到油价字段');
  }
  if (!current.updatedAt) current.updatedAt = new Date().toISOString();
  if (!current.nextAdjustAt && current.updatedAt) {
    const estimated = new Date(current.updatedAt);
    estimated.setDate(estimated.getDate() + 10);
    current.nextAdjustAt = estimated.toISOString();
    current.nextAdjustEstimated = true;
  } else {
    current.nextAdjustEstimated = false;
  }
  return current;
}

function safeGetCache(ctx) {
  try {
    const cached = ctx.storage && ctx.storage.getJSON(CACHE_KEY);
    return cached && typeof cached === 'object' ? cached : null;
  } catch (_) {
    return null;
  }
}

function safeSetCache(ctx, data) {
  try {
    if (ctx.storage) ctx.storage.setJSON(CACHE_KEY, data);
  } catch (_) {
    // Cache is optional; a network result should still render when storage is unavailable.
  }
}

function text(textValue, font, textColor, extra) {
  return Object.assign({ type: 'text', text: String(textValue), font, textColor }, extra || {});
}

function row(children, extra) {
  return Object.assign({ type: 'stack', direction: 'row', alignItems: 'center', gap: 6, children }, extra || {});
}

function column(children, extra) {
  return Object.assign({ type: 'stack', direction: 'column', alignItems: 'start', gap: 4, children }, extra || {});
}

function labelValue(label, value, color) {
  return row([
    text(label, { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1, minScale: 0.7 }),
    { type: 'spacer' },
    text(value, { size: 'caption1', weight: 'semibold' }, color || COLORS.primary, { maxLines: 1, minScale: 0.65, textAlign: 'right' }),
  ]);
}

function buildHeader(data) {
  return row([
    {
      type: 'image',
      src: 'sf-symbol:fuelpump.fill',
      width: 18,
      height: 18,
      color: COLORS.accent,
    },
    column([
      text(data.region, { size: 'headline', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.7 }),
      text(data.stale ? '缓存数据' : '实时油价', { size: 'caption2', weight: 'medium' }, data.stale ? COLORS.warning : COLORS.positive, { maxLines: 1 }),
    ], { gap: 1 }),
  ], { gap: 7 });
}

function buildUpdatedLine(data) {
  return row([
    text('更新', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
    text(formatDateTime(data.updatedAt), { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1, minScale: 0.65 }),
  ], { gap: 4 });
}

function buildNextLine(data) {
  const prefix = data.nextAdjustEstimated ? '下次调价(估)' : '下次调价';
  return column([
    row([
      text(prefix, { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1, minScale: 0.65 }),
      { type: 'spacer' },
      text(formatDateTime(data.nextAdjustAt), { size: 'caption2', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.55, textAlign: 'right' }),
    ]),
    data.nextAdjustAt
      ? {
        type: 'date',
        date: data.nextAdjustAt,
        format: 'relative',
        font: { size: 'caption2', weight: 'medium' },
        textColor: COLORS.accent,
        maxLines: 1,
        minScale: 0.7,
      }
      : text('暂无调整时间', { size: 'caption2' }, COLORS.secondary, { maxLines: 1 }),
  ], { gap: 2 });
}

function buildPriceRows(data) {
  return column([
    labelValue('95号汽油', `${displayPrice(data.gasoline95)} 元/L`),
    labelValue('98号汽油', `${displayPrice(data.gasoline98)} 元/L`),
    labelValue('0号柴油', `${displayPrice(data.diesel)} 元/L`),
  ], { gap: 5 });
}

function buildWidget(data, family, refreshAfter) {
  if (family === 'accessoryInline') {
    return {
      type: 'widget',
      children: [text(`${data.region} 92号 ${displayPrice(data.gasoline92)} 预测 ${displayPrice(data.prediction)}`, { size: 'caption1', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.5 })],
      padding: 2,
      backgroundColor: COLORS.background,
      refreshAfter,
    };
  }
  if (family === 'accessoryCircular') {
    return {
      type: 'widget',
      children: [
        text(data.region, { size: 'caption2', weight: 'semibold' }, COLORS.secondary, { maxLines: 1, minScale: 0.6, textAlign: 'center' }),
        text(displayPrice(data.gasoline92), { size: 'title3', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.55, textAlign: 'center' }),
        text(`预 ${displayPrice(data.prediction)}`, { size: 'caption2', weight: 'medium' }, COLORS.accent, { maxLines: 1, minScale: 0.55, textAlign: 'center' }),
      ],
      gap: 2,
      padding: 5,
      backgroundColor: COLORS.background,
      refreshAfter,
    };
  }
  if (family === 'accessoryRectangular') {
    return {
      type: 'widget',
      children: [
        row([
          text(data.region, { size: 'caption1', weight: 'semibold' }, COLORS.primary, { maxLines: 1, minScale: 0.65 }),
          { type: 'spacer' },
          text(`92 ${displayPrice(data.gasoline92)}`, { size: 'caption1', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.6, textAlign: 'right' }),
        ]),
        text(`预测 ${displayPrice(data.prediction)} · 调价 ${formatDateTime(data.nextAdjustAt)}`, { size: 'caption2', weight: 'medium' }, COLORS.accent, { maxLines: 1, minScale: 0.5 }),
      ],
      gap: 3,
      padding: 5,
      backgroundColor: COLORS.background,
      refreshAfter,
    };
  }

  const isSmall = family === 'systemSmall';
  const isLarge = family === 'systemLarge' || family === 'systemExtraLarge';
  const children = [buildHeader(data)];

  if (isSmall) {
    children.push(row([
      column([
        text('92号汽油', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
        text(`${displayPrice(data.gasoline92)}`, { size: 'title2', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.65 }),
        text('元/L', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
      ], { gap: 1 }),
      { type: 'spacer' },
      column([
        text('预测', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
        text(displayPrice(data.prediction), { size: 'headline', weight: 'semibold' }, COLORS.accent, { maxLines: 1, minScale: 0.65 }),
        text('元/L', { size: 'caption2', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
      ], { gap: 1 }),
    ], { alignItems: 'end', gap: 8 }));
    children.push(buildUpdatedLine(data));
    children.push(buildNextLine(data));
  } else {
    children.push(row([
      column([
        text('92号汽油', { size: 'caption1', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
        text(`${displayPrice(data.gasoline92)} 元/L`, { size: isLarge ? 'largeTitle' : 'title2', weight: 'bold' }, COLORS.primary, { maxLines: 1, minScale: 0.55 }),
      ], { gap: 1 }),
      { type: 'spacer' },
      column([
        text('预测', { size: 'caption1', weight: 'medium' }, COLORS.secondary, { maxLines: 1 }),
        text(`${displayPrice(data.prediction)} 元/L`, { size: 'title3', weight: 'semibold' }, COLORS.accent, { maxLines: 1, minScale: 0.6 }),
      ], { gap: 1 }),
    ], { alignItems: 'end', gap: 10 }));
    children.push(buildPriceRows(data));
    children.push(buildUpdatedLine(data));
    children.push(buildNextLine(data));
  }

  return {
    type: 'widget',
    children,
    gap: isLarge ? 10 : 8,
    padding: isSmall ? 12 : 14,
    backgroundColor: COLORS.background,
    refreshAfter,
  };
}

function buildErrorWidget(message, refreshAfter) {
  return {
    type: 'widget',
    children: [
      row([
        { type: 'image', src: 'sf-symbol:exclamationmark.triangle.fill', width: 18, height: 18, color: COLORS.error },
        text('油价小组件', { size: 'headline', weight: 'bold' }, COLORS.primary, { maxLines: 1 }),
      ], { gap: 7 }),
      text(message, { size: 'caption1', weight: 'medium' }, COLORS.error, { maxLines: 5, minScale: 0.7 }),
      text('请检查 Env 中的 API_URL 和接口返回', { size: 'caption2' }, COLORS.secondary, { maxLines: 2, minScale: 0.7 }),
    ],
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.background,
    refreshAfter,
  };
}

export default async function (ctx) {
  const region = getEnv(ctx, 'REGION', DEFAULT_REGION);
  const refreshMinutes = parseRefreshMinutes(getEnv(ctx, 'REFRESH_MINUTES', DEFAULT_REFRESH_MINUTES));
  const timeout = parseTimeout(getEnv(ctx, 'API_TIMEOUT', DEFAULT_TIMEOUT));
  const refreshAfter = new Date(Date.now() + refreshMinutes * 60 * 1000).toISOString();
  const apiTemplate = getEnv(ctx, 'API_URL', '');
  const family = ctx && ctx.widgetFamily ? ctx.widgetFamily : 'systemMedium';

  if (!apiTemplate) {
    return buildErrorWidget('未配置数据接口', refreshAfter);
  }

  let data = null;
  let errorMessage = '';
  try {
    const response = await ctx.http.get(buildApiUrl(apiTemplate, region), {
      headers: parseHeaders(getEnv(ctx, 'API_HEADERS', '')),
      timeout,
      credentials: 'omit',
    });
    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response ? response.status : '请求失败'}`);
    }
    data = normalizePayload(await response.json(), region);
    data.cachedAt = new Date().toISOString();
    safeSetCache(ctx, data);
  } catch (error) {
    errorMessage = error && error.message ? error.message : '请求失败';
    data = safeGetCache(ctx);
    if (data && regionMatches(data.region, region)) data.stale = true;
    else data = null;
  }

  if (!data) {
    return buildErrorWidget(`暂时无法获取油价：${errorMessage}`, refreshAfter);
  }
  data.stale = Boolean(data.stale);
  return buildWidget(data, family, refreshAfter);
}
