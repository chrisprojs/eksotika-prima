"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SUPPORTED_CURRENCIES,
  convertFromIdr,
  getDefaultCurrencyForLocale,
} from "@/lib/currency";
import { formatCurrency, getLocaleFromPathname } from "@/lib/i18n";

const CURRENCY_STORAGE_KEY = "ep.currency";
const RATES_STORAGE_KEY = "ep.rates";
const RATES_AT_STORAGE_KEY = "ep.ratesAt";
const RATES_TTL_MS = 60 * 60 * 1000;

const DEFAULT_RATES = { IDR: 1 };

const CurrencyContext = createContext(null);

function buildContextValue(currency, rates, setCurrency) {
  const activeRate = rates?.[currency] ?? 1;

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
  // First paint matches the SSR locale default so there is no hydration
  // mismatch; localStorage reconciliation happens in an effect after mount.
  const localeDefault = getDefaultCurrencyForLocale(
    getLocaleFromPathname(pathname || "/")
  );

  const [currency, setCurrencyState] = useState(localeDefault);
  const [rates, setRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);

    if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

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
        const response = await fetch("/api/currency");

        if (!response.ok) {
          return;
        }

        const payload = await response.json();

        if (cancelled || !payload?.rates) {
          return;
        }

        setRates(payload.rates);
        window.localStorage.setItem(
          RATES_STORAGE_KEY,
          JSON.stringify(payload.rates)
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

  function setCurrency(next) {
    if (!SUPPORTED_CURRENCIES.includes(next)) {
      return;
    }

    setCurrencyState(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, next);
    }
  }

  const value = useMemo(
    () => buildContextValue(currency, rates, setCurrency),
    [currency, rates]
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
