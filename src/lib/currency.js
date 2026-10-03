import { defaultLocale, englishLocale, normalizeLocale } from "@/lib/i18n";

// Local price is always IDR, regardless of locale. Import price currency is
// mapped per localization language: Bahasa (id) -> IDR, English (en) -> USD.
export const baseCurrency = "IDR";

const importCurrencyByLocale = {
  [defaultLocale]: "IDR",
  [englishLocale]: "USD",
};

const EXCHANGE_RATE_ENDPOINT =
  "https://api.frankfurter.dev/v2/rates?base=idr&quotes=usd";

// Rate used when the exchange rate API is unreachable. Kept conservative and
// updated with the latest observed IDR -> USD rate.
const FALLBACK_IDR_TO_USD_RATE = 0.000056;

// Cache the fetched rate for an hour so we do not hit the API on every request.
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedRate = null;
let cachedRateTimestamp = 0;
let inFlightRateRequest = null;

export function getImportCurrency(locale = defaultLocale) {
  return importCurrencyByLocale[normalizeLocale(locale)] || baseCurrency;
}

function parseRateFromPayload(payload) {
  // The Frankfurter v2 rates endpoint returns an array of quote objects:
  // [{ "date": "...", "base": "IDR", "quote": "USD", "rate": 5.6e-05 }]
  if (Array.isArray(payload)) {
    const quote = payload.find(
      (item) => String(item?.quote).toUpperCase() === "USD"
    );
    return Number(quote?.rate);
  }

  // Be tolerant of the legacy object shape: { rates: { USD: 5.6e-05 } }
  const legacyRate = payload?.rates?.USD;
  return Number(legacyRate);
}

async function fetchIdrToUsdRate() {
  const response = await fetch(EXCHANGE_RATE_ENDPOINT, {
    // Let Next.js cache the upstream response and revalidate hourly.
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed: ${response.status}`);
  }

  const payload = await response.json();
  const rate = parseRateFromPayload(payload);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Exchange rate response did not contain a valid USD rate");
  }

  return rate;
}

export async function getIdrToUsdRate() {
  const now = Date.now();

  if (cachedRate && now - cachedRateTimestamp < RATE_CACHE_TTL_MS) {
    return cachedRate;
  }

  if (!inFlightRateRequest) {
    inFlightRateRequest = fetchIdrToUsdRate()
      .then((rate) => {
        cachedRate = rate;
        cachedRateTimestamp = Date.now();
        return rate;
      })
      .catch((error) => {
        console.error("Falling back to default IDR -> USD rate:", error);
        return cachedRate || FALLBACK_IDR_TO_USD_RATE;
      })
      .finally(() => {
        inFlightRateRequest = null;
      });
  }

  return inFlightRateRequest;
}

// Returns the multiplier that converts an IDR amount into the import currency
// for the given locale. For IDR this is 1 (no conversion).
export async function getImportConversionRate(locale = defaultLocale) {
  if (getImportCurrency(locale) !== "USD") {
    return 1;
  }

  return getIdrToUsdRate();
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

function convertVariantImportPrices(variant, rate) {
  if (!variant || typeof variant !== "object") {
    return variant;
  }

  return {
    ...variant,
    // Local price fields (price, dozenPrice) are left untouched so the
    // explicit "Local Price" option always stays in IDR.
    importPrice: convertAmount(variant.importPrice, rate),
    importDozenPrice: convertAmount(variant.importDozenPrice, rate),
    // fromPrice is the strike-through reference shown alongside the import
    // price (never shown with the local price), so convert it too for a
    // coherent same-currency discount. The original IDR value is preserved
    // on fromPriceLocal for any local-price context that needs it.
    fromPriceLocal: variant.fromPrice,
    fromPrice: convertAmount(variant.fromPrice, rate),
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
// reused across many products without refetching).
async function resolveImportConversion(localeOrConversion = defaultLocale) {
  if (
    localeOrConversion &&
    typeof localeOrConversion === "object" &&
    "rate" in localeOrConversion
  ) {
    return {
      rate: localeOrConversion.rate,
      importCurrency: localeOrConversion.importCurrency || baseCurrency,
    };
  }

  const locale = localeOrConversion;
  return {
    importCurrency: getImportCurrency(locale),
    rate: await getImportConversionRate(locale),
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
