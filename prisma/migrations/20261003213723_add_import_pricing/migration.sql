-- CreateTable AppConfig
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- AlterTable Variant - Add import price columns
ALTER TABLE "Variant" ADD COLUMN "importPrice" INTEGER;
ALTER TABLE "Variant" ADD COLUMN "importDozenPrice" INTEGER;

-- Insert default import price gap percentage
INSERT OR IGNORE INTO "AppConfig" ("key", "value") VALUES ('importPriceGapPercentage', '10');

-- Create trigger to auto-calculate importPrice on INSERT
CREATE TRIGGER "variant_set_import_price_insert" 
AFTER INSERT ON "Variant"
BEGIN
  UPDATE "Variant" 
  SET "importPrice" = CAST(CAST(NEW."price" AS REAL) * (1 + (CAST((SELECT "value" FROM "AppConfig" WHERE "key" = 'importPriceGapPercentage') AS REAL) / 100)) AS INTEGER)
  WHERE "variantId" = NEW."variantId";
END;

-- Create trigger to auto-calculate importDozenPrice on INSERT
CREATE TRIGGER "variant_set_import_dozen_price_insert" 
AFTER INSERT ON "Variant"
BEGIN
  UPDATE "Variant" 
  SET "importDozenPrice" = CASE 
    WHEN NEW."dozenPrice" IS NOT NULL THEN CAST(CAST(NEW."dozenPrice" AS REAL) * (1 + (CAST((SELECT "value" FROM "AppConfig" WHERE "key" = 'importPriceGapPercentage') AS REAL) / 100)) AS INTEGER)
    ELSE NULL
  END
  WHERE "variantId" = NEW."variantId";
END;

-- Create trigger to auto-calculate importPrice on UPDATE of price
CREATE TRIGGER "variant_update_import_price" 
AFTER UPDATE OF "price" ON "Variant"
BEGIN
  UPDATE "Variant" 
  SET "importPrice" = CAST(CAST(NEW."price" AS REAL) * (1 + (CAST((SELECT "value" FROM "AppConfig" WHERE "key" = 'importPriceGapPercentage') AS REAL) / 100)) AS INTEGER)
  WHERE "variantId" = NEW."variantId";
END;

-- Create trigger to auto-calculate importDozenPrice on UPDATE of dozenPrice
CREATE TRIGGER "variant_update_import_dozen_price" 
AFTER UPDATE OF "dozenPrice" ON "Variant"
BEGIN
  UPDATE "Variant" 
  SET "importDozenPrice" = CASE 
    WHEN NEW."dozenPrice" IS NOT NULL THEN CAST(CAST(NEW."dozenPrice" AS REAL) * (1 + (CAST((SELECT "value" FROM "AppConfig" WHERE "key" = 'importPriceGapPercentage') AS REAL) / 100)) AS INTEGER)
    ELSE NULL
  END
  WHERE "variantId" = NEW."variantId";
END;
