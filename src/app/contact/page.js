import React from 'react'
import { ContactInformation, formatPhoneNumber } from '@/data/ContactInformation'
import Image from 'next/image'
import './page.css'

function Contact() {
  return (
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
  )
}

export default Contact