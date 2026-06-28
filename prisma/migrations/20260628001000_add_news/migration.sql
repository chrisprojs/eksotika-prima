-- CreateTable
CREATE TABLE "News" (
    "newsId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "coverImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AddColumn
ALTER TABLE "News" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Education' CHECK ("category" IN ('Education', 'Crazy News'));

-- CreateTable
CREATE TABLE "NewsProduct" (
    "newsId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    PRIMARY KEY ("newsId", "productId"),
    CONSTRAINT "NewsProduct_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News" ("newsId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NewsProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("productId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");