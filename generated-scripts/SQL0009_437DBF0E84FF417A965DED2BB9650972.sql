-- Fallback script for table FCL1$Workflow Step Argument Archive$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Workflow Step Argument Archive$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Workflow Step Argument Archive$437dbf0e-84ff-417a-965d-ed2bb9650972] ([ID], [Type], [General Journal Template Name], [General Journal Batch Name], [Notification User ID], [Response Function Name], [Link Target Page], [Custom Link], [Event Conditions], [Approver Type], [Approver Limit Type], [Workflow User Group Code], [Due Date Formula], [Message], [Delegate After], [Show Confirmation Message], [Table No_], [Field No_], [Approver User ID], [Response Type], [Response User ID], [Original Record ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [ID], [Type], [General Journal Template Name], [General Journal Batch Name], [Notification User ID], [Response Function Name], [Link Target Page], [Custom Link], [Event Conditions], [Approver Type], [Approver Limit Type], [Workflow User Group Code], [Due Date Formula], [Message], [Delegate After], [Show Confirmation Message], [Table No_], [Field No_], [Approver User ID], [Response Type], [Response User ID], [Original Record ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Workflow Step Argument Archive$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;