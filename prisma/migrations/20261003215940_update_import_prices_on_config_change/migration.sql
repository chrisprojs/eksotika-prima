-- Migration: Add trigger to update all import prices when importPriceGapPercentage config changes

-- Create trigger to update all import prices when importPriceGapPercentage is updated
CREATE TRIGGER "update_all_import_prices_on_config_change"
AFTER UPDATE OF "value" ON "AppConfig"
WHEN NEW."key" = 'importPriceGapPercentage'
BEGIN
  -- Update importPrice for all variants
  UPDATE "Variant"
  SET "importPrice" = CAST(CAST("price" AS REAL) * (1 + (CAST(NEW."value" AS REAL) / 100)) AS INTEGER)
  WHERE "price" IS NOT NULL;
  
  -- Update importDozenPrice for all variants that have dozenPrice
  UPDATE "Variant"
  SET "importDozenPrice" = CAST(CAST("dozenPrice" AS REAL) * (1 + (CAST(NEW."value" AS REAL) / 100)) AS INTEGER)
  WHERE "dozenPrice" IS NOT NULL;
END;