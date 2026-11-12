-- Add stable ownership to quotations so SSO own/all scope is enforced server-side.
SET @has_created_by_user_id := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotations_v2' AND COLUMN_NAME = 'createdByUserId');
--> statement-breakpoint
SET @quotation_owner_sql := IF(@has_created_by_user_id = 0, 'ALTER TABLE `quotations_v2` ADD COLUMN `createdByUserId` varchar(128) NULL', 'SELECT 1');
--> statement-breakpoint
PREPARE quotation_owner_statement FROM @quotation_owner_sql;
--> statement-breakpoint
EXECUTE quotation_owner_statement;
--> statement-breakpoint
DEALLOCATE PREPARE quotation_owner_statement;
--> statement-breakpoint
SET @has_owner_index := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotations_v2' AND INDEX_NAME = 'quotations_v2_created_by_user_id_idx');
--> statement-breakpoint
SET @quotation_owner_index_sql := IF(@has_owner_index = 0, 'CREATE INDEX `quotations_v2_created_by_user_id_idx` ON `quotations_v2` (`createdByUserId`)', 'SELECT 1');
--> statement-breakpoint
PREPARE quotation_owner_index_statement FROM @quotation_owner_index_sql;
--> statement-breakpoint
EXECUTE quotation_owner_index_statement;
--> statement-breakpoint
DEALLOCATE PREPARE quotation_owner_index_statement;
