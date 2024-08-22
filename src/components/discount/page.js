import React from 'react'
import "./page.css"

function DiscountBadge({discountPercentage, isLarge = false}) {
  return (
    <span className={`badge-discount ${isLarge ? `large` : ``}`}>
      <i className="fa-solid fa-tag"></i> {discountPercentage}%
    </span>
  )
}

export default DiscountBadge