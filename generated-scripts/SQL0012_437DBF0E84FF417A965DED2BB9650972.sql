-- Fallback script for table FCL1$Workflow Table Relation Value$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Workflow Table Relation Value$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Workflow Table Relation Value$437dbf0e-84ff-417a-965d-ed2bb9650972] ([Workflow Step Instance ID], [Workflow Code], [Workflow Step ID], [Table ID], [Field ID], [Related Table ID], [Related Field ID], [Value], [Record ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [Workflow Step Instance ID], [Workflow Code], [Workflow Step ID], [Table ID], [Field ID], [Related Table ID], [Related Field ID], [Value], [Record ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Workflow Table Relation Value$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;