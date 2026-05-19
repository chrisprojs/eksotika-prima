-- CreateTable
CREATE TABLE "Product" (
    "productId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "merk" TEXT NOT NULL,
    "produsen" TEXT NOT NULL,
    "detail" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Variant" (
    "variantId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "fromPrice" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "dozenPrice" INTEGER,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("productId") ON DELETE CASCADE ON UPDATE CASCADE
);
