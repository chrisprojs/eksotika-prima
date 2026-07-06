"use client";
import React, { useState } from "react";
import Card from "../card/page";

function CardLoadClient({ products = [], searchable = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const productList = Array.isArray(products) ? products : [];

  const filteredProducts = productList.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {searchable && (
        <div className="product-bar">
          <input
            type="text"
            placeholder="Cari Produk..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="product-input"
          />
        </div>
      )}
      <div className="cardLoad-grid">
        {filteredProducts.map((product) => (
          <Card key={product.title} product={product} />
        ))}
      </div>
    </>
  );
}

export default CardLoadClient;
