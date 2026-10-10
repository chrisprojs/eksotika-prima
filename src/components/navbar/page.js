'use client'
import React, { useEffect, useRef, useState } from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  getLocaleFromPathname,
  getLocalizedPath,
  getPathWithoutLocale,
  getTranslations,
  locales,
} from "@/lib/i18n";
import { useCurrency } from "@/components/currencyProvider/CurrencyProvider";

const localeOptions = {
  id: { flag: "/asset/flags/id.svg", label: "ID", alt: "Bendera Indonesia" },
  en: { flag: "/asset/flags/gb.svg", label: "EN", alt: "United Kingdom flag" },
};

function Navbar() {
  const [isClicked, setClicked] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const router = useRouter();
  const langRef = useRef(null);
  const currencyRef = useRef(null);
  const location = usePathname() || "/";
  const locale = getLocaleFromPathname(location);
  const text = getTranslations(locale).nav;
  const pathWithoutLocale = getPathWithoutLocale(location);
  const isProductPage =
    pathWithoutLocale === "/product" || pathWithoutLocale.startsWith("/product/");
  const isNewsPage =
    pathWithoutLocale === "/news" || pathWithoutLocale.startsWith("/news/");
  const closeMenu = () => setClicked(false);
  const localizedPath = (path) => getLocalizedPath(path, locale);
  const toggleDropdown = (name) =>
    setOpenDropdown((current) => (current === name ? null : name));
  const selectLocale = (code) => {
    closeMenu();
    setOpenDropdown(null);
    if (code !== locale) {
      router.push(getLocalizedPath(pathWithoutLocale, code));
    }
  };
  const selectCurrency = (code) => {
    setOpenDropdown(null);
    if (code !== currency) {
      setCurrency(code);
    }
  };

  useEffect(() => {
    document.documentElement.lang = getTranslations(locale).htmlLang;
  }, [locale]);

  useEffect(() => {
    if (!openDropdown) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      const insideLang = langRef.current && langRef.current.contains(event.target);
      const insideCurrency =
        currencyRef.current && currencyRef.current.contains(event.target);
      if (!insideLang && !insideCurrency) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  return (
    <nav className="navbar-bg">
      <div className="navbar-box">
        <Link
          href={localizedPath("/")}
          className="navbar-logo"
          onClick={closeMenu}
        >
          <Image src="/asset/logo.jpg" alt="logo" className="navbar-logo-image" width={100} height={100} />
          <span className="navbar-logo-name">Eksotika Prima</span>
        </Link>

        <div className="navbar-dropdown navbar-dropdown-language" ref={langRef}>
          <button
            type="button"
            className="navbar-dropdown-toggle"
            onClick={() => toggleDropdown("language")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "language"}
            aria-label={text.languageLabel}
          >
            <Image
              src={localeOptions[locale].flag}
              alt={localeOptions[locale].alt}
              className="navbar-dropdown-flag"
              width={24}
              height={18}
              unoptimized
            />
            <span className="navbar-dropdown-label">{localeOptions[locale].label}</span>
            <span className="navbar-dropdown-caret" aria-hidden="true" />
          </button>

          {openDropdown === "language" && (
            <ul className="navbar-dropdown-list" role="listbox">
              {locales.map((code) => {
                const option = localeOptions[code];
                return (
                  <li key={code} role="option" aria-selected={code === locale}>
                    <button
                      type="button"
                      className={`navbar-dropdown-item ${code === locale ? "active" : ""}`}
                      onClick={() => selectLocale(code)}
                    >
                      <Image
                        src={option.flag}
                        alt={option.alt}
                        className="navbar-dropdown-flag"
                        width={24}
                        height={18}
                        unoptimized
                      />
                      <span className="navbar-dropdown-label">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="navbar-dropdown navbar-dropdown-currency" ref={currencyRef}>
          <button
            type="button"
            className="navbar-dropdown-toggle"
            onClick={() => toggleDropdown("currency")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "currency"}
            aria-label={text.currencyLabel}
          >
            <span className="navbar-dropdown-label">{currency}</span>
            <span className="navbar-dropdown-caret" aria-hidden="true" />
          </button>

          {openDropdown === "currency" && (
            <ul className="navbar-dropdown-list" role="listbox">
              {supportedCurrencies.map((code) => (
                <li key={code} role="option" aria-selected={code === currency}>
                  <button
                    type="button"
                    className={`navbar-dropdown-item ${code === currency ? "active" : ""}`}
                    onClick={() => selectCurrency(code)}
                  >
                    <span className="navbar-dropdown-label">{code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ul className={`navbar-menu ${isClicked ? "active" : ""}`}>
          <li className="navbar-item">
            <Link
              href={localizedPath("/")}
              className={`navbar-link ${pathWithoutLocale === "/" ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.home}
            </Link>
          </li>
          <li className="navbar-item">
            <Link
              href={localizedPath("/product")}
              className={`navbar-link ${isProductPage ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.products}
            </Link>
          </li>
          <li className="navbar-item">
            <Link
              href={localizedPath("/news")}
              className={`navbar-link ${isNewsPage ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.news}
            </Link>
          </li>
          <li className="navbar-item">
            <Link
              href={localizedPath("/contact")}
              className={`navbar-link ${pathWithoutLocale === "/contact" ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.contact}
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="menu-icon"
          onClick={() => setClicked(!isClicked)}
          aria-label="Menu"
        >
          <span className={`menu-icon-symbol ${isClicked ? "close" : "open"}`} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
