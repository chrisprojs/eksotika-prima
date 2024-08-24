'use client';
import React, { useEffect, useState } from "react";
import "./page.css";
import { ContactInformation, formatPhoneNumber } from "@/data/ContactInformation";
import Image from "next/image";
import Reminder from "../reminder/page";


function Footer() {
  const [isFooterPositioned, setIsFooterPositioned] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const footerElement = document.querySelector('.footer');
      const rect = footerElement.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight-150 && rect.bottom >= 0;

      setIsFooterPositioned(isInView);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className="footer">
      <div className="footer-box">
        <p>Contact Us:</p>
        <div className="footer-icon-box">
          <div className="footer-contact-column">
            <a href={ContactInformation.tokopediaLink} target="_blank" rel="noreferrer" className="icon-logo">
              <Image src='/asset/tokopedia-logo.png' alt="Tokopedia" className="icon-image" width={100} height={100}/>
            </a>
            <a href={ContactInformation.shopeeLink} target="_blank" rel="noreferrer" className="icon-logo">
              <Image src='/asset/shopee-logo.png' alt="Shopee" className="icon-image" width={100} height={100}/>
            </a>
          </div>
          <div className="footer-contact-column footer-icon-text-box">
            <a href={`https://wa.me/${ContactInformation.whatsappNumber}`} target="_blank" rel="noreferrer" className="icon-text">
              <p className="footer-icon-text">
              <Image src='/asset/whatsapp-logo.png' alt="WhatsApp" className="icon-image" width={100} height={100}/>
              <span className="footer-phonenumber">{formatPhoneNumber(ContactInformation.whatsappNumber)} &#40;{ContactInformation.phoneNumberOwner}&#41;</span>
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div className={`footer-reminder ${!isFooterPositioned ? 'visible' : ''}`}>
      <Reminder />
    </div>
    </>
  );
}

export default Footer;
