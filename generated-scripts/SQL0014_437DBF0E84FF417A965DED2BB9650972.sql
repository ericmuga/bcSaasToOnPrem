-- Fallback script for table FCL1$Job Queue Log Entry$437dbf0e-84ff-417a-965d-ed2bb9650972
BEGIN TRANSACTION;

DELETE FROM [FCL1$Job Queue Log Entry$437dbf0e-84ff-417a-965d-ed2bb9650972];

INSERT INTO [FCL1$Job Queue Log Entry$437dbf0e-84ff-417a-965d-ed2bb9650972] ([Entry No_], [ID], [User ID], [Start Date_Time], [End Date_Time], [Object Type to Run], [Object ID to Run], [Status], [Description], [Error Message], [Job Queue Category Code], [Error Call Stack], [Parameter String], [Error Message Register Id], [XML], [System Task Id], [User Session ID], [User Service Instance ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy])
SELECT [Entry No_], [ID], [User ID], [Start Date_Time], [End Date_Time], [Object Type to Run], [Object ID to Run], [Status], [Description], [Error Message], [Job Queue Category Code], [Error Call Stack], [Parameter String], [Error Message Register Id], [XML], [System Task Id], [User Session ID], [User Service Instance ID], [$systemId], [$systemCreatedAt], [$systemCreatedBy], [$systemModifiedAt], [$systemModifiedBy]
FROM [FCL].[dbo].[FCL1$Job Queue Log Entry$437dbf0e-84ff-417a-965d-ed2bb9650972];

COMMIT;