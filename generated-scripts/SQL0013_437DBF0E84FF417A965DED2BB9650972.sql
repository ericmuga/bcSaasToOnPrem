-- Fallback script for table FCL1$Item Register$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Item Register$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Item Register$437dbf0e-84ff-417a-965d-ed2bb9650972] ([No_], [From Entry No_], [To Entry No_], [Creation Date], [Source Code], [User ID], [Journal Batch Name], [Creation Time], [From Phys_ Inventory Entry No_], [To Phys_ Inventory Entry No_], [From Value Entry No_], [To Value Entry No_], [From Capacity Entry No_], [To Capacity Entry No_], [Cost Adjustment Run Guid], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [No_], [From Entry No_], [To Entry No_], [Creation Date], [Source Code], [User ID], [Journal Batch Name], [Creation Time], [From Phys_ Inventory Entry No_], [To Phys_ Inventory Entry No_], [From Value Entry No_], [To Value Entry No_], [From Capacity Entry No_], [To Capacity Entry No_], [Cost Adjustment Run Guid], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Item Register$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;