import Image from "next/image";
import CardLoad from "@/components/cardLoad/page";
import ReasonSection from "@/components/reasonSection/page";
import AboutSection from "@/components/aboutSection/page";
import ShopSection from "@/components/shopSection/page";
import TestimoniSection from "@/components/testimoniSection/page";
import NewsSection from "@/components/newsSection/page";
import FaqSection from "@/components/faqSection/page";
import { getTranslations } from "@/lib/i18n";
import "@/app/page.css";
import ExportShippingSection from "@/components/exportShippingSection/page";

export default function HomePage({ locale = "id" }) {
  const text = getTranslations(locale).home;

  return (
    <>
      <div className="home-img-container">
        <Image src="/asset/home_template_1.jpg" alt="Eksotika Prima" className="home-img-template" width={1024} height={256} />
        <div className="home-img-banner-text">
          <h1 className="home-img-text">{text.heroTitle}</h1>
          <h2 className="home-img-text2">{text.heroSubtitle}</h2>
        </div>
        <div className="home-blast-sign">
          <p>{text.blast}</p>
        </div>
      </div>
      <div className="home-location-box">
        <p className="home-location-text">{text.location}</p>
      </div>
      <div className="page-container home-about-container">
        <AboutSection locale={locale}/>
      </div>
      <div className="page-container">
        <p className="page-heading">{text.productsHeading}</p>
        <CardLoad locale={locale}/>
      </div>
      <div className="page-container">
        <ExportShippingSection locale={locale} />
      </div>
      <div className="page-container page-grey">
        <ReasonSection locale={locale}/>
      </div>
      <div className="page-container">
        <NewsSection locale={locale}/>
      </div>
      <div className="page-container page-grey">
        <ShopSection locale={locale}/>
      </div>
      <div className="page-container">
        <TestimoniSection locale={locale}/>
      </div>
      <div className="page-container page-grey">
        <FaqSection locale={locale}/>
      </div>
    </>
  );
}