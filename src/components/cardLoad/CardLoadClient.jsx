"use client";
import React, { useState } from "react";
import Card from "../card/page";
import { getTranslations } from "@/lib/i18n";

function CardLoadClient({ products = [], searchable = false, locale = "id" }) {
  const [searchTerm, setSearchTerm] = useState("");
  const productList = Array.isArray(products) ? products : [];
  const text = getTranslations(locale).productList;

  const filteredProducts = productList.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {searchable && (
        <div className="product-bar">
          <input
            type="text"
            placeholder={text.searchPlaceholder}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="product-input"
          />
        </div>
      )}
      <div className="cardLoad-grid">
        {filteredProducts.map((product) => (
          <Card key={product.title} product={product} locale={locale} />
        ))}
      </div>
    </>
  );
}

export default CardLoadClient;