"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  EXCHANGE_RATE_ENDPOINT,
  SUPPORTED_CURRENCIES,
  convertFromIdr,
  getDefaultCurrencyForLocale,
  parseRatesFromPayload,
} from "@/lib/currency";
import { formatCurrency, getLocaleFromPathname } from "@/lib/i18n";

// Per-language override is namespaced by locale (ep.currency.id, ep.currency.en)
// so a choice made while viewing one language never bleeds into the other.
const CURRENCY_STORAGE_PREFIX = "ep.currency";
const RATES_STORAGE_KEY = "ep.rates";
const RATES_AT_STORAGE_KEY = "ep.ratesAt";
const RATES_TTL_MS = 60 * 60 * 1000;

// The only always-known rate is IDR itself (base currency, always 1). There is
// no hardcoded fallback table: until the live Frankfurter map loads, any
// non-IDR selection is shown unconverted in IDR rather than guessed.
const DEFAULT_RATES = { IDR: 1 };

const CurrencyContext = createContext(null);

function getCurrencyStorageKey(locale) {
  return `${CURRENCY_STORAGE_PREFIX}.${locale}`;
}

// Reads the stored override for a specific locale. Returns null when there is
// no valid stored value (so the caller falls back to that locale's default).
function readStoredCurrencyForLocale(locale) {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(getCurrencyStorageKey(locale));

  return stored && SUPPORTED_CURRENCIES.includes(stored) ? stored : null;
}

function buildContextValue(currency, rates, setCurrency, ratesUnavailable) {
  // The live conversion is always raw IDR x rates[selectedCurrency], where
  // rates is the Frankfurter-backed IDR->X map. A rate is usable only when it
  // is a finite positive number (IDR is always 1). When the selected currency
  // has no usable rate it is NOT converted: the raw IDR amount is shown with an
  // IDR label, never an unconverted number under a foreign-currency label.
  const selectedRate = Number(rates?.[currency]);
  const hasRate =
    currency === "IDR" || (Number.isFinite(selectedRate) && selectedRate > 0);

  return {
    currency,
    setCurrency,
    rates,
    ratesUnavailable,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    convertImport(amountIdr) {
      // No usable rate => no conversion: return the raw IDR amount.
      return convertFromIdr(amountIdr, hasRate ? rates[currency] : 1);
    },
    formatImport(amountIdr) {
      // No usable rate => format the raw IDR amount with an IDR label so the
      // number and the label always agree.
      return hasRate
        ? formatCurrency(convertFromIdr(amountIdr, rates[currency]), currency)
        : formatCurrency(amountIdr, "IDR");
    },
  };
}

export function CurrencyProvider({ children }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname || "/");
  // First paint matches the SSR locale default so there is no hydration
  // mismatch; the per-locale localStorage override is reconciled in an effect
  // after mount.
  const localeDefault = getDefaultCurrencyForLocale(locale);

  const [currency, setCurrencyState] = useState(localeDefault);
  const [rates, setRates] = useState(DEFAULT_RATES);
  // Starts false so the server render and the first client paint agree; it only
  // ever flips to true inside the post-mount fetch effect, keeping the render
  // hydration-safe. True means a live fetch failed with no fresh cache.
  const [ratesUnavailable, setRatesUnavailable] = useState(false);

  // Reselect the active currency whenever the locale changes: use that
  // locale's own stored override if present, otherwise that locale's default.
  // Runs after mount (post-hydration), so the first paint stays on the SSR
  // locale default. Navigating between /id and /en re-runs this and swaps to
  // the correct per-language value without the other language leaking in.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = readStoredCurrencyForLocale(locale);
    setCurrencyState(stored ?? getDefaultCurrencyForLocale(locale));
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const cachedRates = window.localStorage.getItem(RATES_STORAGE_KEY);
    const cachedAt = Number(window.localStorage.getItem(RATES_AT_STORAGE_KEY));
    let hasFreshCache = false;

    if (
      cachedRates &&
      Number.isFinite(cachedAt) &&
      Date.now() - cachedAt < RATES_TTL_MS
    ) {
      try {
        const parsed = JSON.parse(cachedRates);

        if (parsed && typeof parsed === "object") {
          setRates(parsed);
          hasFreshCache = true;
          return;
        }
      } catch {
        // Ignore malformed cache and fall through to a fresh fetch.
      }
    }

    // Marks live rates as unavailable, but only when there is no fresh cache to
    // fall back to. This is what the currency-unavailable popup listens to.
    function markUnavailable() {
      if (!cancelled && !hasFreshCache) {
        setRatesUnavailable(true);
      }
    }

    async function loadRates() {
      try {
        // Fetch the IDR->X rates straight from the public Frankfurter API in
        // the browser. No in-app proxy route and no server-only fetch options
        // (the `next: { revalidate }` hint is omitted here on purpose).
        const response = await fetch(EXCHANGE_RATE_ENDPOINT);

        if (!response.ok) {
          markUnavailable();
          return;
        }

        const payload = await response.json();
        const parsed = parseRatesFromPayload(payload);

        if (cancelled) {
          return;
        }

        if (!Number.isFinite(Number(parsed?.USD)) || Number(parsed.USD) <= 0) {
          // The response did not yield a usable rate map; keep IDR only and
          // flag unavailability (unless a fresh cache already covered us).
          markUnavailable();
          return;
        }

        // No hardcoded fallbacks: only IDR (base, always 1) plus the live
        // Frankfurter rates. A symbol missing from the response simply stays
        // unconverted (shown in IDR) rather than guessed.
        const nextRates = { IDR: 1, ...parsed };

        setRates(nextRates);
        setRatesUnavailable(false);
        window.localStorage.setItem(
          RATES_STORAGE_KEY,
          JSON.stringify(nextRates)
        );
        window.localStorage.setItem(
          RATES_AT_STORAGE_KEY,
          String(Date.now())
        );
      } catch {
        // Network/parse failure: keep IDR only and flag unavailability unless a
        // fresh cache already covered us.
        markUnavailable();
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the override for the CURRENT locale only, so the choice applies to
  // this language without touching the other language's stored value.
  function setCurrency(next) {
    if (!SUPPORTED_CURRENCIES.includes(next)) {
      return;
    }

    setCurrencyState(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(getCurrencyStorageKey(locale), next);
    }
  }

  const value = useMemo(
    () => buildContextValue(currency, rates, setCurrency, ratesUnavailable),
    // setCurrency is stable per render except for the locale it closes over,
    // which is captured through the locale dependency below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, rates, locale, ratesUnavailable]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (context) {
    return context;
  }

  // Safe defaults when no provider is mounted so nothing throws.
  return {
    currency: "IDR",
    setCurrency() {},
    rates: DEFAULT_RATES,
    ratesUnavailable: false,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    convertImport(amountIdr) {
      return convertFromIdr(amountIdr, 1);
    },
    formatImport(amountIdr) {
      return formatCurrency(convertFromIdr(amountIdr, 1), "IDR");
    },
  };
}
