import React from 'react'
import "./page.css"

function DiscountBadge({discountPercentage, isLarge = false}) {
  return (
    <span className={`badge-discount ${isLarge ? `large` : ``}`}>
      <span className="badge-discount-icon" aria-hidden="true" /> {discountPercentage}%
    </span>
  )
}

export default DiscountBadge
