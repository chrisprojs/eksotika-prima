import prisma from "@/lib/prisma";
import {
  getProductLocalizedJsonUpdateData,
  localizeProduct,
  localizeProducts,
} from "@/lib/dbLocalization";
import { defaultLocale } from "@/lib/i18n";

const productInclude = {
  variants: true,
};

function getVariantCreateData(variants = []) {
  return variants.map((variant) => ({
    picture: variant.picture,
    size: variant.size,
    fromPrice: variant.fromPrice,
    price: variant.price,
    dozenPrice: variant.dozenPrice || null,
  }));
}

export async function getAllProducts(locale = defaultLocale) {
  const products = await prisma.product.findMany({
    include: productInclude,
  });

  return localizeProducts(products, locale);
}

export async function getProductById(productId, locale = defaultLocale) {
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId)) {
    return null;
  }

  const product = await prisma.product.findUnique({
    where: { productId: parsedProductId },
    include: productInclude,
  });

  return localizeProduct(product, locale);
}

export async function updateProduct(productId, data) {
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId)) {
    return null;
  }

  const currentProduct = await prisma.product.findUnique({
    where: { productId: parsedProductId },
    select: {
      title: true,
      merk: true,
      detail: true,
    },
  });

  if (!currentProduct) {
    return null;
  }

  return prisma.product.update({
    where: { productId: parsedProductId },
    data: {
      ...getProductLocalizedJsonUpdateData(data, currentProduct),
      produsen: typeof data.produsen === "string" ? data.produsen : undefined,
      variants: Array.isArray(data.variants)
        ? {
            deleteMany: {},
            create: getVariantCreateData(data.variants),
          }
        : undefined,
    },
    include: productInclude,
  });
}

export async function getSitemapProducts() {
  return prisma.product.findMany({
    select: {
      productId: true,
      title: true,
      merk: true,
      detail: true,
    },
    orderBy: { productId: "asc" },
  });
}