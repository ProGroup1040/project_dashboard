CREATE TABLE `complaint_replies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaintId` int NOT NULL,
	`repliedBy` varchar(64) NOT NULL,
	`replierName` text NOT NULL,
	`replierRole` enum('admin','engineer','aftersales','client') NOT NULL,
	`message` text NOT NULL,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complaint_replies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseIndex` int NOT NULL,
	`submittedBy` varchar(64) NOT NULL,
	`submitterName` text NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`imageUrl` text,
	`status` enum('open','in_review','closed') NOT NULL DEFAULT 'open',
	`closedBy` varchar(64),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phase_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseIndex` int NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedBy` varchar(64),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phase_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `phase_statuses_phaseIndex_unique` UNIQUE(`phaseIndex`)
);
--> statement-breakpoint
CREATE TABLE `project_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`displayName` text NOT NULL,
	`role` enum('admin','engineer','aftersales','client') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `project_users_username_unique` UNIQUE(`username`)
);
