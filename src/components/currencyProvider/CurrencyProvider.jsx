"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  EXCHANGE_RATE_ENDPOINT,
  FALLBACK_RATES,
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

// Seed the rate map with the IDR->X fallbacks so a non-IDR selection converts
// with a real exchange rate from first interaction, even before the live
// Frankfurter map has loaded. IDR itself is always 1 (base currency).
const DEFAULT_RATES = { IDR: 1, ...FALLBACK_RATES };

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

function buildContextValue(currency, rates, setCurrency) {
  // The live conversion is always raw IDR x rates[selectedCurrency], where
  // rates is the Frankfurter-backed IDR->X map. For a non-IDR currency that is
  // somehow missing from the map, fall back to the IDR->X fallback rate rather
  // than 1, so we never display an unconverted IDR amount under a foreign
  // currency label.
  const activeRate =
    rates?.[currency] ?? (currency === "IDR" ? 1 : FALLBACK_RATES[currency] ?? 1);

  return {
    currency,
    setCurrency,
    rates,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    convertImport(amountIdr) {
      return convertFromIdr(amountIdr, activeRate);
    },
    formatImport(amountIdr) {
      return formatCurrency(convertFromIdr(amountIdr, activeRate), currency);
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

    if (
      cachedRates &&
      Number.isFinite(cachedAt) &&
      Date.now() - cachedAt < RATES_TTL_MS
    ) {
      try {
        const parsed = JSON.parse(cachedRates);

        if (parsed && typeof parsed === "object") {
          setRates(parsed);
          return;
        }
      } catch {
        // Ignore malformed cache and fall through to a fresh fetch.
      }
    }

    async function loadRates() {
      try {
        // Fetch the IDR->X rates straight from the public Frankfurter API in
        // the browser. No in-app proxy route and no server-only fetch options
        // (the `next: { revalidate }` hint is omitted here on purpose).
        const response = await fetch(EXCHANGE_RATE_ENDPOINT);

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const parsed = parseRatesFromPayload(payload);

        if (cancelled || !Number.isFinite(Number(parsed?.USD)) || Number(parsed.USD) <= 0) {
          // Keep the current rates (locale default / cached) if the response
          // did not yield a usable rate map.
          return;
        }

        // Seed with the real IDR->X fallbacks so a symbol missing from the
        // response never silently converts by 1. IDR is always the base (1).
        const nextRates = { IDR: 1, ...FALLBACK_RATES, ...parsed };

        setRates(nextRates);
        window.localStorage.setItem(
          RATES_STORAGE_KEY,
          JSON.stringify(nextRates)
        );
        window.localStorage.setItem(
          RATES_AT_STORAGE_KEY,
          String(Date.now())
        );
      } catch {
        // Keep the current rates (locale default / cached) on failure.
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
    () => buildContextValue(currency, rates, setCurrency),
    // setCurrency is stable per render except for the locale it closes over,
    // which is captured through the locale dependency below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, rates, locale]
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
    supportedCurrencies: SUPPORTED_CURRENCIES,
    convertImport(amountIdr) {
      return convertFromIdr(amountIdr, 1);
    },
    formatImport(amountIdr) {
      return formatCurrency(convertFromIdr(amountIdr, 1), "IDR");
    },
  };
}
