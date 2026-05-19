import prisma from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

export default async function sitemap() {
  const staticRoutes = ["", "/product", "/contact"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const products = await prisma.product.findMany({
      select: { productId: true },
      orderBy: { productId: "asc" },
    });

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${siteUrl}/product/${product.productId}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Failed to build product sitemap:", error);
    return staticRoutes;
  }
}
