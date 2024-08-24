import React from 'react'
import './page.css'
import Image from 'next/image'
import { ContactInformation, formatPhoneNumber } from '@/data/ContactInformation'

function Reminder() {
  return (
    <div className='reminder-bg'>
      <div className="reminder-contact-column reminder-icon-text-box">
        <p className="icon-text">Mau Nego Atau Beli? Silahkan Hubungi:</p>
        <a href={`https://wa.me/${ContactInformation.whatsappNumber}`} target="_blank" rel="noreferrer" className="icon-text">
          <p className="reminder-icon-text">
          <Image src='/asset/whatsapp-logo.png' alt="WhatsApp" className="icon-image" width={100} height={100}/>
          <span className="reminder-phonenumber">{formatPhoneNumber(ContactInformation.whatsappNumber)} &#40;Chris&#41;</span>
          </p>
        </a>
      </div>
    </div>
  )
}

export default Reminder