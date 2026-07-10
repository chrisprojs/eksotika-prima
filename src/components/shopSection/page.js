import React from "react"
import Image from "next/image"
import { ContactInformation } from "@/data/ContactInformation"
import { getTranslations } from "@/lib/i18n"
import "./page.css"

function ShopSection({ locale = "id" }) {
  const text = getTranslations(locale).shop

  return (
    <div className="shop-container">
      <h2 className="shop-heading">{text.heading}</h2>
      <div className="shop-grid">
        <a 
          href={ContactInformation.tokopediaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-card-link"
        >
          <div className="shop-card">
            <div className="shop-logo-container">
              <Image 
                src="/asset/shop/eksotika_prima_ttk_logo.jpg" 
                alt="Eksotika Prima TTK" 
                className="shop-logo"
                width={150}
                height={150}
              />
            </div>
            <h3 className="shop-title">Eksotika Prima TTK</h3>
            <p className="shop-platform">Tokopedia & Tiktok Shop</p>
            <div className="ecommerce-logos">
              <Image 
                src="/asset/ecommerce/tokopedia-logo.png" 
                alt="Tokopedia" 
                className="ecommerce-logo"
                width={30}
                height={30}
              />
              <Image 
                src="/asset/ecommerce/tiktokshop-logo.png" 
                alt="Tiktok Shop" 
                className="ecommerce-logo"
                width={30}
                height={30}
              />
            </div>
            <div className="shop-rating">
              <span className="rating-value">Rating 4.9/5.0</span>
              <span className="rating-detail">{text.tokopediaDetail}</span>
            </div>
          </div>
        </a>
        <a 
          href={ContactInformation.shopeeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-card-link"
        >
          <div className="shop-card">
            <div className="shop-logo-container">
              <Image 
                src="/asset/shop/rosita_shop_shopee_logo.jpg" 
                alt="Rosita Shop" 
                className="shop-logo"
                width={150}
                height={150}
              />
            </div>
            <h3 className="shop-title">Rosita Shop</h3>
            <p className="shop-platform">Shopee</p>
            <div className="ecommerce-logos">
              <Image 
                src="/asset/ecommerce/shopee-logo.png" 
                alt="Shopee" 
                className="ecommerce-logo"
                width={30}
                height={30}
              />
            </div>
            <div className="shop-rating">
              <span className="rating-value">Rating 4.9/5.0</span>
              <span className="rating-detail">{text.shopeeDetail}</span>
            </div>
          </div>
        </a>
        <a 
          href={ContactInformation.blibliLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-card-link"
        >
          <div className="shop-card">
            <div className="shop-logo-container">
              <Image 
                src="/asset/shop/eksotika_prima_blibli_logo.jpg" 
                alt="Eksotika Prima" 
                className="shop-logo"
                width={150}
                height={150}
              />
            </div>
            <h3 className="shop-title">Eksotika Prima</h3>
            <p className="shop-platform">Blibli</p>
            <div className="ecommerce-logos">
              <Image 
                src="/asset/ecommerce/blibli-logo.png" 
                alt="Blibli" 
                className="ecommerce-logo"
                width={30}
                height={30}
              />
            </div>
            <div className="shop-rating">
              <span className="rating-value">Rating 4.9/5.0</span>
              <span className="rating-detail">{text.blibliDetail}</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

export default ShopSection;