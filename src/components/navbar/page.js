'use client'
import React, { useEffect, useState } from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  getLocaleFromPathname,
  getLocalizedPath,
  getPathWithoutLocale,
  getTranslations,
} from "@/lib/i18n";

function Navbar() {
  const [isClicked, setClicked] = useState(false);
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

  useEffect(() => {
    document.documentElement.lang = getTranslations(locale).htmlLang;
  }, [locale]);

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
          <li className="navbar-item navbar-language" aria-label={text.languageLabel}>
            <Link
              href={getLocalizedPath(pathWithoutLocale, "id")}
              className={`navbar-language-option ${locale === "id" ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.indonesia}
            </Link>
            <span className="navbar-language-divider">/</span>
            <Link
              href={getLocalizedPath(pathWithoutLocale, "en")}
              className={`navbar-language-option ${locale === "en" ? "active" : ""}`}
              onClick={closeMenu}
            >
              {text.english}
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className="menu-icon"
          onClick={() => setClicked(!isClicked)}
          aria-label="Menu"
        >
          <i className={`fa ${isClicked ? "fa-times" : "fa-bars"}`} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;