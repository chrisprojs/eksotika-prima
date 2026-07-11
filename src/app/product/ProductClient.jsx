import React from "react";
import "./page.css";
import CardLoad from "@/components/cardLoad/page";
import ReasonSection from "@/components/reasonSection/page";
import ShopSection from "@/components/shopSection/page";
import { getTranslations } from "@/lib/i18n";
import FaqSection from "@/components/faqSection/page";

export default function ProductClient({ locale = "id" }) {
  const text = getTranslations(locale).productList;

  return (
    <>
      <div className="page-container">
        <h1 className="product-header">{text.heading}</h1>
        <CardLoad searchable locale={locale} />
      </div>
      <div className="page-container page-grey">
        <ReasonSection locale={locale}/>
      </div>
      <div className="page-container">
        <ShopSection locale={locale}/>
      </div>
      <div className="page-container page-grey">
        <FaqSection locale={locale}/>
      </div>
    </>
  );
}