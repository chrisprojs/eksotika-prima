import React from "react";
import "./page.css";
import CardLoad from "@/components/cardLoad/page";
import ReasonSection from "@/components/reasonSection/page";
import ShopSection from "@/components/shopSection/page";

export default function ProductClient() {
  return (
    <>
      <div className="page-container">
        <h1 className="product-header">Cari Minyak Gosok Termurah Se-Indonesia</h1>
        <CardLoad searchable />
      </div>
      <div className="page-container page-grey">
        <ReasonSection/>
      </div>
      <div className="page-container page-grey">
        <ShopSection/>
      </div>
    </>
  );
}
