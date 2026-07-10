import React from "react";
import { getAllProducts } from "@/app/api/products/productService";
import CardLoadClient from "./CardLoadClient";
import "./page.css";

async function CardLoad({ searchable = false, locale = "id" }) {
  const products = await getAllProducts(locale);

  return <CardLoadClient products={products} searchable={searchable} locale={locale} />;
}

export default CardLoad;
