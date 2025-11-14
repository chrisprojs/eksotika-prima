"use client";
import React, { useState } from "react";
import "./page.css";
import CardLoad from "@/components/cardLoad/page";

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
        <div className="product-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="product-input"
          />
        </div>
        <p className="page-heading">Produk Kami</p>
        <CardLoad searchTerm={searchTerm} />
      </div>
    </>
  );
}
