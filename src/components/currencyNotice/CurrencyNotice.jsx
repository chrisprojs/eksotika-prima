"use client";

import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/components/currencyProvider/CurrencyProvider";
import "./page.css";

// How long the toast stays on screen before it auto-dismisses.
const AUTO_DISMISS_MS = 7000;

// A beautiful, non-blocking corner toast that appears once when the live
// exchange-rate fetch fails with no fresh cache, letting the user know prices
// are shown in IDR. Dependency-free and hydration-safe: it reads a flag that
// starts false and only flips post-mount, and it renders null until visible so
// the server render and first client paint stay empty.
export default function CurrencyNotice() {
  const { ratesUnavailable } = useCurrency();
  const [visible, setVisible] = useState(false);
  // Tracks the previous flag value so the toast fires once per failed load
  // (on the false -> true transition) instead of on every render.
  const previousUnavailable = useRef(false);

  useEffect(() => {
    if (ratesUnavailable && !previousUnavailable.current) {
      setVisible(true);
    }

    previousUnavailable.current = ratesUnavailable;
  }, [ratesUnavailable]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setVisible(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="currency-notice" role="status" aria-live="polite">
      <span className="currency-notice-accent" aria-hidden="true">
        !
      </span>
      <div className="currency-notice-body">
        <p className="currency-notice-title">Exchange rate unavailable</p>
        <p className="currency-notice-text">
          We couldn&apos;t load live exchange rates, so prices are shown in IDR.
        </p>
      </div>
      <button
        type="button"
        className="currency-notice-close"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
      >
        &times;
      </button>
    </div>
  );
}
