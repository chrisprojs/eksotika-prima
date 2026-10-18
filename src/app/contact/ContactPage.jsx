import React from "react";
import { ContactInformation, formatPhoneNumber } from "@/data/ContactInformation";
import Image from "next/image";
import ReasonSection from "@/components/reasonSection/page";
import { getTranslations } from "@/lib/i18n";
import "@/app/contact/page.css";

export default function ContactPage({ locale = "id" }) {
  const text = getTranslations(locale).nav;

  return (
    <>
      <div className="page-container contact-container">
        <h1 className="contact-title">{text.contact}</h1>
        <div className="contact-box">
          <div className="contact-info">
            <div>
              <a
                href={ContactInformation.tokopediaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                <Image src="/asset/ecommerce/tokopedia-logo.png" alt="Tokopedia" className="contact-icon" width={30} height={30}/> {ContactInformation.tokopediaLink}
              </a>
            </div>
            <div>
              <a
                href={ContactInformation.shopeeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                <Image src="/asset/ecommerce/shopee-logo.png" alt="Shopee" className="contact-icon" width={30} height={30}/> {ContactInformation.shopeeLink}
              </a>
            </div>
            <div>
              <a
                href={ContactInformation.blibliLink}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                <Image src="/asset/ecommerce/blibli-logo.png" alt="Blibli" className="contact-icon" width={30} height={30}/> {ContactInformation.blibliLink}
              </a>
            </div>
            <div>
              <a
                href={`https://wa.me/${ContactInformation.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-info-link"
              >
                <Image src="/asset/whatsapp-logo.png" alt="WhatsApp" className="contact-icon" width={30} height={30}/> {formatPhoneNumber(ContactInformation.whatsappNumber)} &#40;{ContactInformation.phoneNumberOwner}&#41;
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="page-container page-grey">
        <ReasonSection locale={locale}/>
      </div>
    </>
  );
}