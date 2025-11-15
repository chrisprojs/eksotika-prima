import React from 'react'
import { ContactInformation, formatPhoneNumber } from '@/data/ContactInformation'
import Image from 'next/image'
import './page.css'

const baseUrl = process.env.NEXT_PUBLIC_URL
export const metadata = {
  metadataBase: new URL(baseUrl),

  title: "Kontak Kami | Eksotika Prima",
  description:
    "Kontak Kami | Eksotika Prima",
  
  openGraph: {
    title: "Kontak Kami | Eksotika Prima",
    description:
      "Kontak Kami | Eksotika Prima",
    url: `${baseUrl}`,
    siteName: "Eksotika Prima",
    type: "website",
    images: [
      {
        url: `${baseUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`,
        alt: "Kontak Kami | Eksotika Prima",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kontak Kami | Eksotika Prima",
    description:
      "Kontak Kami | Eksotika Prima",
    images: [`${baseUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`],
  },

  alternates: {
    canonical: `${baseUrl}/contact`, // <-- add canonical here
  },
};

function Contact() {
  return (
    <>
      <div className='page-container contact-container'>
      <h1 className='contact-title'>Hubungi Kami</h1>
      <div className="contact-box">
        <div className="contact-info">
          <div>
            <a
              href={ContactInformation.tokopediaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-info-link"
            >
              <Image src='/asset/tokopedia-logo.png' alt="Tokopedia" className="contact-icon" width={100} height={100}/> {ContactInformation.tokopediaLink}
            </a>
          </div>
          <div>
            <a
              href={ContactInformation.shopeeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-info-link"
            >
              <Image src='/asset/shopee-logo.png' alt="Shopee" className="contact-icon" width={100} height={100}/> {ContactInformation.shopeeLink}
            </a>
          </div>
          <div>
            <a
              href={`tel:${ContactInformation.whatsappNumber}`}
              className="contact-info-link"
            >
              <Image src='/asset/whatsapp-logo.png' alt="WhatsApp" className="contact-icon" width={100} height={100}/> {formatPhoneNumber(ContactInformation.whatsappNumber)} &#40;{ContactInformation.phoneNumberOwner}&#41;
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Contact