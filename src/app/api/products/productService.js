import prisma from "@/lib/prisma";

const productInclude = {
  variants: true,
};

export async function getAllProducts() {
  return prisma.product.findMany({
    include: productInclude,
  });
}

export async function getProductById(productId) {
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId)) {
    return null;
  }

  return prisma.product.findUnique({
    where: { productId: parsedProductId },
    include: productInclude,
  });
}

export async function getSitemapProducts() {
  return prisma.product.findMany({
    select: { productId: true },
    orderBy: { productId: "asc" },
  });
}
