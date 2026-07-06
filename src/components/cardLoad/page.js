import React from "react";
import { getAllProducts } from "@/app/api/products/productService";
import CardLoadClient from "./CardLoadClient";
import "./page.css";

async function CardLoad({ searchable = false }) {
  const products = await getAllProducts();

  return <CardLoadClient products={products} searchable={searchable} />;
}

export default CardLoad;
