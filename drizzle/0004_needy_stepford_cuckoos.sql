CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadNumber` varchar(32) NOT NULL,
	`clientName` varchar(128) NOT NULL,
	`clientPhone` varchar(32),
	`projectType` enum('kitchen','dressing','furniture','finishing','smart_home','full') NOT NULL,
	`quotationValue` int DEFAULT 0,
	`designScore` int DEFAULT 0,
	`assignedEngineer` varchar(128),
	`pipelineStage` enum('new_lead','design_in_progress','design_approved','negotiation_session','proposal','closing','won','lost') NOT NULL DEFAULT 'new_lead',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_leads_leadNumber_unique` UNIQUE(`leadNumber`)
);
--> statement-breakpoint
CREATE TABLE `excel_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`parsedItemsJson` text,
	`totalMaterials` int DEFAULT 0,
	`totalAccessories` int DEFAULT 0,
	`totalLabor` int DEFAULT 0,
	`totalTransport` int DEFAULT 0,
	`grandTotal` int DEFAULT 0,
	`status` enum('pending','parsed','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `excel_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `negotiation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sessionNumber` int NOT NULL DEFAULT 1,
	`engineerName` varchar(128),
	`status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
	`step1Completed` boolean NOT NULL DEFAULT false,
	`step2Completed` boolean NOT NULL DEFAULT false,
	`step3Completed` boolean NOT NULL DEFAULT false,
	`step4Completed` boolean NOT NULL DEFAULT false,
	`step5Completed` boolean NOT NULL DEFAULT false,
	`step6Completed` boolean NOT NULL DEFAULT false,
	`step7Completed` boolean NOT NULL DEFAULT false,
	`clientStyle` varchar(128),
	`clientBudget` int,
	`clientPriority` text,
	`clientNeedsConfirmed` boolean NOT NULL DEFAULT false,
	`layoutExplained` boolean NOT NULL DEFAULT false,
	`storageExplained` boolean NOT NULL DEFAULT false,
	`materialsExplained` boolean NOT NULL DEFAULT false,
	`lightingExplained` boolean NOT NULL DEFAULT false,
	`quotationBreakdownJson` text,
	`closingStatus` enum('ready_to_close','needs_revision','needs_time','lost'),
	`nextAction` enum('follow_up_call','send_revision','visit_showroom','apply_discount','wait_for_decision'),
	`originalTotal` int DEFAULT 0,
	`finalTotal` int DEFAULT 0,
	`totalDiscount` int DEFAULT 0,
	`recordingUrl` text,
	`sessionDurationSeconds` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `negotiation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_accessories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`accessoryName` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`imageUrl` text,
	`videoUrl` text,
	`benefit1` text,
	`benefit2` text,
	`benefit3` text,
	`categoryTag` enum('storage','luxury','convenience','other') DEFAULT 'other',
	`alternativeId` int,
	`decision` enum('approved','hesitant','rejected','pending') NOT NULL DEFAULT 'pending',
	`rejectionReason` enum('price','not_useful','needs_alternative','not_convinced'),
	`multimediaPlayed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_accessories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_changes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`changeType` enum('remove_item','replace_item','adjust_quantity','apply_discount','change_material') NOT NULL,
	`itemName` varchar(255),
	`beforePrice` int NOT NULL,
	`afterPrice` int NOT NULL,
	`changeDetail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_objections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`objectionType` enum('total_price','accessories_price','transportation','delivery_time','materials','payment_method','competitor_comparison','needs_partner_approval','not_convinced_value') NOT NULL,
	`relatedItemName` varchar(255),
	`engineerResponse` text,
	`clientReaction` enum('accepted','still_hesitant','rejected'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_objections_id` PRIMARY KEY(`id`)
);
