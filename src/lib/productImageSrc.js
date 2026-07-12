export function getProductImageSrc(picture) {
  const image = String(picture || "").trim();

  if (!image) {
    return "/favicon.ico";
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `/api/images/product/${image}`;
}

export function getAbsoluteProductImageSrc(picture, siteUrl) {
  const imageSrc = getProductImageSrc(picture);

  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
    return imageSrc;
  }

  return encodeURI(`${siteUrl}${imageSrc}`);
}
