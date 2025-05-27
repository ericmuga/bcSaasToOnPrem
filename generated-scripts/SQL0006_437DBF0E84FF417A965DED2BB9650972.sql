-- Fallback script for table FCL1$Sales Line Discount$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Sales Line Discount$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Sales Line Discount$437dbf0e-84ff-417a-965d-ed2bb9650972] ([Type], [Code], [Sales Type], [Sales Code], [Starting Date], [Currency Code], [Variant Code], [Unit of Measure Code], [Minimum Quantity], [Line Discount _], [Ending Date], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [Type], [Code], [Sales Type], [Sales Code], [Starting Date], [Currency Code], [Variant Code], [Unit of Measure Code], [Minimum Quantity], [Line Discount _], [Ending Date], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Sales Line Discount$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;