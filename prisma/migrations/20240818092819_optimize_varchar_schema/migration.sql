/*
  Warnings:

  - You are about to alter the column `title` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.
  - You are about to alter the column `merk` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.
  - You are about to alter the column `produsen` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.
  - You are about to alter the column `size` on the `Variant` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.
  - You are about to alter the column `picture` on the `Variant` table. The data in that column could be lost. The data in that column will be cast from `NVarChar(1000)` to `VarChar(255)`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Product] ALTER COLUMN [title] VARCHAR(255) NOT NULL;
ALTER TABLE [dbo].[Product] ALTER COLUMN [merk] VARCHAR(255) NOT NULL;
ALTER TABLE [dbo].[Product] ALTER COLUMN [produsen] VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Variant] ALTER COLUMN [size] VARCHAR(255) NOT NULL;
ALTER TABLE [dbo].[Variant] ALTER COLUMN [picture] VARCHAR(255) NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
