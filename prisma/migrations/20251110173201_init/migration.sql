-- CreateTable
CREATE TABLE "Product" (
    "productId" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "merk" VARCHAR(255) NOT NULL,
    "produsen" VARCHAR(255) NOT NULL,
    "detail" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "Variant" (
    "variantId" SERIAL NOT NULL,
    "size" VARCHAR(255) NOT NULL,
    "picture" VARCHAR(255) NOT NULL,
    "fromPrice" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "dozenPrice" INTEGER,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("variantId")
);

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE CASCADE ON UPDATE CASCADE;
