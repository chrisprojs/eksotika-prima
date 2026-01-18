"use client";
import React, { useState } from "react";
import "./page.css";
import CardLoad from "@/components/cardLoad/page";
import ReasonSection from "@/components/reasonSection/page";
import ShopSection from "@/components/shopSection/page";

export default function ProductClient() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      {/* Basic SEO */}
      <title>Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima</title>
      <div className="page-container">
        <h1 className="product-header">Cari Minyak Gosok Termurah Se-Indonesia</h1>
        <div className="product-bar">
          <input
            type="text"
            placeholder="Cari Produk..."
            value={searchTerm}
            onChange={handleSearch}
            className="product-input"
          />
        </div>
        <p className="page-heading">Produk Kami</p>
        <CardLoad searchTerm={searchTerm} />
      </div>
      <div className='page-container page-grey'>
        <ReasonSection/>
      </div>
      <div className='page-container page-grey'>
        <ShopSection/>
      </div>
    </>
  );
}
