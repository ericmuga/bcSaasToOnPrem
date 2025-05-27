-- Fallback script for table FCL1$Workflow Step Instance Archive$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Workflow Step Instance Archive$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Workflow Step Instance Archive$437dbf0e-84ff-417a-965d-ed2bb9650972] ([ID], [Workflow Code], [Workflow Step ID], [Description], [Entry Point], [Record ID], [Created Date-Time], [Created By User ID], [Last Modified Date-Time], [Last Modified By User ID], [Status], [Previous Workflow Step ID], [Next Workflow Step ID], [Type], [Function Name], [Argument], [Original Workflow Code], [Original Workflow Step ID], [Sequence No_], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [ID], [Workflow Code], [Workflow Step ID], [Description], [Entry Point], [Record ID], [Created Date-Time], [Created By User ID], [Last Modified Date-Time], [Last Modified By User ID], [Status], [Previous Workflow Step ID], [Next Workflow Step ID], [Type], [Function Name], [Argument], [Original Workflow Code], [Original Workflow Step ID], [Sequence No_], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Workflow Step Instance Archive$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;