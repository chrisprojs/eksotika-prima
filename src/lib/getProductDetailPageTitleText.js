export function getProductDetailPageTitleText(product, variantSize, quantity, text) {
  if (!product || !variantSize) return product?.title || "";
  let quantityText = "";

  if (quantity === "12") {
    quantityText = ` - ${text.dozenSuffix}`;
  }

  if (quantity === "wholesale") {
    quantityText = ` - ${text.wholesaleSuffix}`;
  }

  const shippingText = text.internationalShippingSuffix
    ? ` | ${text.internationalShippingSuffix}`
    : "";

  return `${product.title} - ${variantSize}${quantityText}${shippingText} | Eksotika Prima`;
}