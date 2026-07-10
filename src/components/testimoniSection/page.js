import React from 'react'
import Image from 'next/image'
import { getTranslations } from '@/lib/i18n'
import "./page.css"

function TestimoniSection({ locale = 'id' }) {
  const text = getTranslations(locale).testimonials

  return (
    <div className="testimoni-container">
      <h2 className="testimoni-heading">{text.heading}</h2>
      <p className="testimoni-disclaimer">
        {text.disclaimer}
      </p>
      <div className="testimoni-grid">
        {text.items.map((testimonial) => (
          <div key={testimonial.id} className="testimoni-card">
            <div className="testimoni-profile">
              <div className="testimoni-image-container">
                <Image 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="testimoni-image"
                  width={80}
                  height={80}
                />
              </div>
              <h3 className="testimoni-name">{testimonial.name}</h3>
            </div>
            <p className="testimoni-comment">&ldquo;{testimonial.comment}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimoniSection