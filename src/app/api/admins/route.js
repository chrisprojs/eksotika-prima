import prisma from "@/lib/prisma";
import { updateProduct } from "@/app/api/products/productService";
import { getProductLocalizedJsonCreateData } from "@/lib/dbLocalization";
import { NextResponse } from "next/server";

function validateAdminKey(req) {
  const adminKey = req.headers.get("admin-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  return Boolean(process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY);
}

function isValidProductPayload(product) {
  return Boolean(
    product &&
      product.title !== undefined &&
      product.merk !== undefined &&
      typeof product.produsen === "string" &&
      product.detail !== undefined &&
      Array.isArray(product.variants)
  );
}

function getVariantCreateData(variants = []) {
  return variants.map((variant) => ({
    picture: variant.picture,
    size: variant.size,
    fromPrice: variant.fromPrice,
    price: variant.price,
    dozenPrice: variant.dozenPrice || null,
  }));
}

function getProductCreateData(product) {
  return {
    ...getProductLocalizedJsonCreateData(product),
    produsen: product.produsen,
    variants: {
      create: getVariantCreateData(product.variants),
    },
  };
}

export async function POST(req) {
  if (!validateAdminKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing Admin key" },
      { status: 401 }
    );
  }

  const data = await req.json();
  const url = new URL(req.url);
  const postMany = url.searchParams.get("post_many") === "true";

  if (postMany) {
    if (!Array.isArray(data) || data.some((product) => !isValidProductPayload(product))) {
      return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
    }

    try {
      await prisma.$transaction(
        data.map((product) =>
          prisma.product.create({
            data: getProductCreateData(product),
          })
        )
      );

      return NextResponse.json("Many Products Successfully Posted", { status: 201 });
    } catch (error) {
      console.error("Error creating many products:", error);
      return NextResponse.json({ error: "Error creating many products" }, { status: 500 });
    }
  }

  if (!isValidProductPayload(data)) {
    return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: getProductCreateData(data),
      include: { variants: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error creating product" }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!validateAdminKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing Admin key" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id") || url.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  const data = await req.json();

  try {
    const product = await updateProduct(productId, data);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error updating product" }, { status: 500 });
  }
}