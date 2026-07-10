import { defaultLocale, locales, normalizeLocale } from "@/lib/i18n";

export const productLocalizedFields = ["title", "merk", "detail"];
export const newsLocalizedFields = ["slug", "title", "summary", "contentHtml"];

const productRequiredLocaleFields = ["title"];
const newsRequiredLocaleFields = ["slug"];

function parseJsonObject(value) {
  if (typeof value !== "string") return null;

  try {
    const parsedValue = JSON.parse(value);
    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
      ? parsedValue
      : null;
  } catch {
    return null;
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function normalizeLocaleKey(locale) {
  const localeKey = String(locale || "").toLowerCase();
  return locales.includes(localeKey) ? localeKey : null;
}

function normalizeTextValue(value) {
  return typeof value === "string"
    ? value.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n")
    : value;
}

function normalizeLocalizedEntries(value) {
  return Object.fromEntries(
    Object.entries(value)
      .map(([locale, text]) => [normalizeLocaleKey(locale), normalizeTextValue(text)])
      .filter(([locale, text]) => locale && typeof text === "string")
  );
}

function normalizeLocalizedObject(value, fallbackText = "") {
  const parsedValue = parseJsonObject(value);

  if (parsedValue) {
    return normalizeLocalizedEntries(parsedValue);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeLocalizedEntries(value);
  }

  return isNonEmptyString(value)
    ? { [defaultLocale]: value }
    : { [defaultLocale]: fallbackText };
}

function getLocalizedJsonText(
  value,
  locale = defaultLocale,
  { fallbackToDefault = false } = {}
) {
  const localizedValue = normalizeLocalizedObject(value, value || "");
  const normalizedLocale = normalizeLocale(locale);

  if (isNonEmptyString(localizedValue[normalizedLocale])) {
    return localizedValue[normalizedLocale];
  }

  if (fallbackToDefault && isNonEmptyString(localizedValue[defaultLocale])) {
    return localizedValue[defaultLocale];
  }

  return "";
}

function hasLocalizedJsonText(value, locale = defaultLocale) {
  return isNonEmptyString(getLocalizedJsonText(value, locale));
}

function hasLocalizedFields(record, fields, locale = defaultLocale) {
  if (!record) return false;

  return fields.every((field) => hasLocalizedJsonText(record[field], locale));
}

function applyJsonLocalization(record, fields, locale = defaultLocale) {
  if (!record) return record;

  const localizedRecord = { ...record };

  fields.forEach((field) => {
    localizedRecord[field] = getLocalizedJsonText(record[field], locale, {
      fallbackToDefault: true,
    });
  });

  return localizedRecord;
}

function getFieldLocalePatch(data, field) {
  const patch = {};
  const directValue = data[field];
  const englishValue = data[`${field}En`];

  if (directValue !== undefined) {
    Object.assign(patch, normalizeLocalizedObject(directValue, ""));
  }

  if (typeof englishValue === "string") {
    patch.en = englishValue;
  }

  return patch;
}

function createLocalizedJsonValue(data, field) {
  const patch = getFieldLocalePatch(data, field);
  return JSON.stringify({
    [defaultLocale]: "",
    ...patch,
  });
}

function mergeLocalizedJsonValue(currentValue, data, field) {
  const currentLocalizedValue = normalizeLocalizedObject(currentValue, "");
  const patch = getFieldLocalePatch(data, field);

  return JSON.stringify({
    ...currentLocalizedValue,
    ...patch,
  });
}

export function isProductLocalized(product, locale = defaultLocale) {
  return hasLocalizedFields(product, productRequiredLocaleFields, locale);
}

export function isNewsLocalized(news, locale = defaultLocale) {
  return hasLocalizedFields(news, newsRequiredLocaleFields, locale);
}

export function getSupportedLocales(record, fields) {
  return locales.filter((locale) => hasLocalizedFields(record, fields, locale));
}

export function getProductSupportedLocales(product) {
  return getSupportedLocales(product, productRequiredLocaleFields);
}

export function getNewsSupportedLocales(news) {
  return getSupportedLocales(news, newsRequiredLocaleFields);
}

export function getLocalizedJsonCreateData(data = {}, fields = []) {
  return Object.fromEntries(
    fields
      .filter((field) => data[field] !== undefined || data[`${field}En`] !== undefined)
      .map((field) => [field, createLocalizedJsonValue(data, field)])
  );
}

export function getLocalizedJsonUpdateData(data = {}, fields = [], currentRecord = {}) {
  return Object.fromEntries(
    fields
      .filter((field) => data[field] !== undefined || data[`${field}En`] !== undefined)
      .map((field) => [field, mergeLocalizedJsonValue(currentRecord[field], data, field)])
  );
}

export function localizeProduct(product, locale = defaultLocale) {
  if (!isProductLocalized(product, locale)) return null;
  return applyJsonLocalization(product, productLocalizedFields, locale);
}

export function localizeProducts(products = [], locale = defaultLocale) {
  return products
    .filter((product) => isProductLocalized(product, locale))
    .map((product) => localizeProduct(product, locale));
}

export function localizeNews(news, locale = defaultLocale) {
  if (!isNewsLocalized(news, locale)) return null;

  const localizedNews = applyJsonLocalization(news, newsLocalizedFields, locale);

  if (!localizedNews?.products) {
    return localizedNews;
  }

  return {
    ...localizedNews,
    products: localizedNews.products
      .filter((item) => isProductLocalized(item.product, locale))
      .map((item) => ({
        ...item,
        product: localizeProduct(item.product, locale),
      })),
  };
}

export function localizeNewsList(newsList = [], locale = defaultLocale) {
  return newsList
    .filter((news) => isNewsLocalized(news, locale))
    .map((news) => localizeNews(news, locale));
}

export function getNewsLocalizedJsonCreateData(data = {}) {
  return getLocalizedJsonCreateData(data, newsLocalizedFields);
}

export function getNewsLocalizedJsonUpdateData(data = {}, currentRecord = {}) {
  return getLocalizedJsonUpdateData(data, newsLocalizedFields, currentRecord);
}

export function getProductLocalizedJsonCreateData(data = {}) {
  return getLocalizedJsonCreateData(data, productLocalizedFields);
}

export function getProductLocalizedJsonUpdateData(data = {}, currentRecord = {}) {
  return getLocalizedJsonUpdateData(data, productLocalizedFields, currentRecord);
}