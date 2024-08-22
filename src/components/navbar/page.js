'use client'
import React, { useState } from "react";
import "./page.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function Navbar() {
  const [isClicked, setClicked] = useState(false);
  const location = usePathname();  // Get current location

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
              Home
            </Link>
          </li>
          <li className="navbar-link">
            <Link
              href="/product"
              className={`navbar-link  ${
                location === "/product" ? "active" : ""
              }`}
              onClick={() => setClicked(!isClicked)}
            >
              Product
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
              Contact
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
