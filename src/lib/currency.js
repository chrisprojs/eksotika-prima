import { defaultLocale, englishLocale, normalizeLocale } from "@/lib/i18n";

// Local price is always IDR, regardless of locale. Import price currency is
// mapped per localization language: Bahasa (id) -> IDR, English (en) -> USD.
export const baseCurrency = "IDR";

// The full list of currencies the client currency selector can switch between.
// IDR is first because it is the base/local currency.
export const SUPPORTED_CURRENCIES = [
  "IDR",
  "USD",
  "EUR",
  "GBP",
  "SGD",
  "MYR",
  "AUD",
  "JPY",
  "KRW",
  "CNY",
  "AED",
  "SAR"
];

const importCurrencyByLocale = {
  [defaultLocale]: "IDR",
  [englishLocale]: "USD",
};

// Direct Frankfurter v2 endpoint. Exported so the client provider can fetch it
// straight from the browser (Frankfurter is a public, CORS-enabled API) without
// going through an in-app proxy route.
export const EXCHANGE_RATE_ENDPOINT =
  "https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd,eur,gbp,sgd,myr,aud,jpy,krw,cny,aed,sar";

// Cache the fetched rate map for an hour so we do not hit the API on every
// request.
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedRates = null;
let cachedRatesTimestamp = 0;
let inFlightRatesRequest = null;

export function getImportCurrency(locale = defaultLocale) {
  return importCurrencyByLocale[normalizeLocale(locale)] || baseCurrency;
}

// Returns the default import currency for a locale (id -> IDR, en -> USD),
// reusing the same locale map as getImportCurrency.
export function getDefaultCurrencyForLocale(locale = defaultLocale) {
  return importCurrencyByLocale[normalizeLocale(locale)] || baseCurrency;
}

// Number of fraction digits a currency should display: IDR and JPY are
// whole-unit currencies, everything else keeps up to two decimals.
export function getCurrencyFractionDigits(currency) {
  return currency === "IDR" || currency === "JPY" ? 0 : 2;
}

// Pure, client-safe conversion from an IDR amount using a precomputed rate.
// Rounds to two decimals; passes through null/undefined/non-finite values.
export function convertFromIdr(amountIdr, rate) {
  if (amountIdr === null || amountIdr === undefined) {
    return amountIdr;
  }

  const numericAmount = Number(amountIdr);
  const numericRate = Number(rate);

  if (!Number.isFinite(numericAmount) || !Number.isFinite(numericRate)) {
    return amountIdr;
  }

  return Math.round(numericAmount * numericRate * 100) / 100;
}

// Parses the Frankfurter v2 payload into an uppercase-keyed IDR->X rate map.
// Pure and client-safe, so both the server fetch and the client provider can
// reuse it. Exported for the client provider.
export function parseRatesFromPayload(payload) {
  const rates = {};

  // The Frankfurter v2 rates endpoint returns a FLAT ARRAY of quote objects:
  // [{ "date": "...", "base": "IDR", "quote": "USD", "rate": 5.6e-05 }, ...]
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const quote = String(item?.quote || "").toUpperCase();
      const rate = Number(item?.rate);

      if (quote && Number.isFinite(rate) && rate > 0) {
        rates[quote] = rate;
      }
    }

    return rates;
  }

  // Be tolerant of the legacy object shape: { rates: { USD: 5.6e-05 } }
  const legacyRates = payload?.rates;

  if (legacyRates && typeof legacyRates === "object") {
    for (const [quote, value] of Object.entries(legacyRates)) {
      const rate = Number(value);

      if (Number.isFinite(rate) && rate > 0) {
        rates[String(quote).toUpperCase()] = rate;
      }
    }
  }

  return rates;
}

async function fetchIdrRates() {
  const response = await fetch(EXCHANGE_RATE_ENDPOINT, {
    // Let Next.js cache the upstream response and revalidate hourly.
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed: ${response.status}`);
  }

  const payload = await response.json();
  const rates = parseRatesFromPayload(payload);

  if (!Number.isFinite(Number(rates.USD)) || Number(rates.USD) <= 0) {
    throw new Error("Exchange rate response did not contain a valid USD rate");
  }

  return rates;
}

// Returns an IDR -> X rate map including IDR itself (always 1). Only the live
// Frankfurter rates are merged in; there is NO hardcoded fallback table. When
// the API is unreachable (and nothing is cached) the map is exactly { IDR: 1 },
// so any currency without a live rate is simply not converted.
export async function getIdrRateMap() {
  const now = Date.now();

  if (cachedRates && now - cachedRatesTimestamp < RATE_CACHE_TTL_MS) {
    return cachedRates;
  }

  if (!inFlightRatesRequest) {
    inFlightRatesRequest = fetchIdrRates()
      .then((fetched) => {
        cachedRates = { IDR: 1, ...fetched };
        cachedRatesTimestamp = Date.now();
        return cachedRates;
      })
      .catch((error) => {
        console.error("Exchange rate fetch failed; using IDR only:", error);
        return cachedRates || { IDR: 1 };
      })
      .finally(() => {
        inFlightRatesRequest = null;
      });
  }

  return inFlightRatesRequest;
}

// Returns the live IDR -> USD rate, or null when no usable USD rate is
// available. Callers must treat null as "no conversion" (effective rate 1,
// IDR label) rather than substituting a guessed number.
export async function getIdrToUsdRate() {
  const rates = await getIdrRateMap();
  const usd = Number(rates?.USD);

  return Number.isFinite(usd) && usd > 0 ? usd : null;
}

// Returns the multiplier that converts an IDR amount into the import currency
// for the given locale. For IDR this is 1 (no conversion). For a USD locale
// with no live USD rate, this is also 1 (no conversion) so the amount stays in
// IDR instead of being multiplied by a guessed number.
export async function getImportConversionRate(locale = defaultLocale) {
  if (getImportCurrency(locale) !== "USD") {
    return 1;
  }

  const usd = await getIdrToUsdRate();

  return Number.isFinite(usd) && usd > 0 ? usd : 1;
}

function convertAmount(amount, rate) {
  if (amount === null || amount === undefined) {
    return amount;
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return amount;
  }

  if (rate === 1) {
    return numericAmount;
  }

  const converted = numericAmount * rate;

  // Keep sub-unit precision for small foreign-currency values (e.g. USD),
  // while whole IDR values pass through unchanged because rate === 1 above.
  return Math.round(converted * 100) / 100;
}

export function convertVariantImportPrices(variant, rate) {
  if (!variant || typeof variant !== "object") {
    return variant;
  }

  // Capture the genuine raw IDR DB amounts BEFORE anything is converted.
  // These `*Idr` fields are the single source of truth the client uses to
  // convert into the user-selected currency (raw IDR x Frankfurter rate), so
  // they must never carry a value that has already been through a conversion.
  // Guard against a variant that was passed through this helper more than once
  // by preferring an existing raw-IDR snapshot over the (possibly already
  // overwritten) importPrice/fromPrice fields.
  const importPriceIdr =
    variant.importPriceIdr ?? variant.importPrice ?? variant.price;
  const importDozenPriceIdr =
    variant.importDozenPriceIdr ?? variant.importDozenPrice;
  const fromPriceIdr = variant.fromPriceIdr ?? variant.fromPrice;

  return {
    ...variant,
    // Raw IDR values preserved for the live client conversion.
    importPriceIdr,
    importDozenPriceIdr,
    fromPriceIdr,
    // Local price fields (price, dozenPrice) are left untouched so the
    // explicit "Local Price" option always stays in IDR.
    //
    // The server-side locale-default conversion is applied to importPrice/
    // importDozenPrice/fromPrice. These are ONLY consumed by the server SEO
    // renderers (metadata, JSON-LD offers, news related-product price), which
    // must stay on the locale default and must not read browser state. The
    // client never reuses these fields for its on-screen display. Convert from
    // the raw IDR snapshot so a double pass still yields the correct result.
    importPrice: convertAmount(importPriceIdr, rate),
    importDozenPrice: convertAmount(importDozenPriceIdr, rate),
    // fromPrice is the strike-through reference shown alongside the import
    // price (never shown with the local price), so convert it too for a
    // coherent same-currency discount. The original IDR value is preserved
    // on fromPriceLocal for any local-price context that needs it.
    fromPriceLocal: fromPriceIdr,
    fromPrice: convertAmount(fromPriceIdr, rate),
  };
}

// Applies the import-currency conversion to a localized product. The stored
// import prices are in IDR; for English they are converted to USD. An
// `importCurrency` field is attached so the UI can label prices correctly.
export async function applyImportCurrency(product, localeOrConversion = defaultLocale) {
  if (!product) return product;

  const { importCurrency, rate } = await resolveImportConversion(
    localeOrConversion
  );

  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => convertVariantImportPrices(variant, rate))
    : product.variants;

  return {
    ...product,
    importCurrency,
    variants,
  };
}

// Resolves the conversion rate and currency label from either a locale string
// or a precomputed { rate, importCurrency } object (so a shared rate can be
// reused across many products without refetching). The label is forced to IDR
// whenever the effective rate is 1 (no real conversion happened), so a
// foreign-currency label can never sit on an unconverted IDR amount.
export async function resolveImportConversion(localeOrConversion = defaultLocale) {
  if (
    localeOrConversion &&
    typeof localeOrConversion === "object" &&
    "rate" in localeOrConversion
  ) {
    const rate = localeOrConversion.rate;
    const converted = Number.isFinite(Number(rate)) && Number(rate) !== 1;

    return {
      rate,
      importCurrency: converted
        ? localeOrConversion.importCurrency || baseCurrency
        : baseCurrency,
    };
  }

  const locale = localeOrConversion;
  const rate = await getImportConversionRate(locale);
  const converted = Number.isFinite(Number(rate)) && Number(rate) !== 1;

  return {
    importCurrency: converted ? getImportCurrency(locale) : baseCurrency,
    rate,
  };
}

export async function applyImportCurrencyToProducts(
  products = [],
  localeOrConversion = defaultLocale
) {
  if (!Array.isArray(products) || products.length === 0) {
    return products;
  }

  // Fetch the rate once and reuse it for every product/variant.
  const { importCurrency, rate } = await resolveImportConversion(
    localeOrConversion
  );

  return products.map((product) => {
    if (!product) return product;

    const variants = Array.isArray(product.variants)
      ? product.variants.map((variant) =>
          convertVariantImportPrices(variant, rate)
        )
      : product.variants;

    return { ...product, importCurrency, variants };
  });
}
