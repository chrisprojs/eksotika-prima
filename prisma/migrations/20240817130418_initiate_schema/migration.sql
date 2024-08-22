BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [productId] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [merk] NVARCHAR(1000) NOT NULL,
    [produsen] NVARCHAR(1000) NOT NULL,
    [detail] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Product_pkey] PRIMARY KEY CLUSTERED ([productId])
);

-- CreateTable
CREATE TABLE [dbo].[Variant] (
    [variantId] INT NOT NULL IDENTITY(1,1),
    [size] NVARCHAR(1000) NOT NULL,
    [picture] NVARCHAR(1000) NOT NULL,
    [fromPrice] INT NOT NULL,
    [price] INT NOT NULL,
    [productId] INT NOT NULL,
    CONSTRAINT [Variant_pkey] PRIMARY KEY CLUSTERED ([variantId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Variant] ADD CONSTRAINT [Variant_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([productId]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
