'use client'
import React, { useState } from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function Navbar() {
  const [isClicked, setClicked] = useState(false);
  const location = usePathname();  // Get current location
  const isProductPage = location === "/product" || location.startsWith("/product/");

  return (
    <nav className="navbar-bg">
      <div className="navbar-box">
        <Link href="/"
            className="navbar-logo"
            onClick={() => setClicked(!isClicked)}>
            <Image src="/asset/logo.jpg" alt="logo" className="navbar-logo-image" width={100} height={100} />
            <p className='navbar-link'>Eksotika Prima</p>
        </Link>
        <ul className={`navbar-menu ${isClicked ? "active" : ""}`}>
          <li className="navbar-link">
            <Link
              href="/"
              className={`navbar-link  ${
                location === "/" ? "active" : ""
              }`}
              onClick={() => setClicked(!isClicked)}
            >
              Beranda
            </Link>
          </li>
          <li className="navbar-link">
            <Link
              href="/product"
              className={`navbar-link  ${
                isProductPage ? "active" : ""
              }`}
              onClick={() => setClicked(!isClicked)}
            >
              Produk
            </Link>
          </li>
          <li className="navbar-link">
            <Link
              href="/news"
              className={`navbar-link  ${
                location === "/news" || location.startsWith("/news/") ? "active" : ""
              }`}
              onClick={() => setClicked(!isClicked)}
            >
              Berita
            </Link>
          </li>
          <li className="navbar-link">
            <Link
              href="/contact"
              className={`navbar-link  ${
                location === "/contact" ? "active" : ""
              }`}
              onClick={() => setClicked(!isClicked)}
            >
              Kontak
            </Link>
          </li>
        </ul>
        <div className="menu-icon" onClick={() => setClicked(!isClicked)}>
          <i className={`fa ${isClicked ? "fa-times" : "fa-bars"}`} />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

