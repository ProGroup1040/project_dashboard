CREATE TABLE `kitchen_accessories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(32) NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `kitchen_accessories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_cladding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `kitchen_cladding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_marble` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`category` enum('granite','porcelain','quartz','other') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `kitchen_marble_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` varchar(64) NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`pricePerMeter` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `kitchen_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationCode` varchar(32) NOT NULL,
	`clientName` varchar(128),
	`clientPhone` varchar(32),
	`address` text,
	`engineerName` varchar(128),
	`quotationDate` timestamp NOT NULL DEFAULT (now()),
	`material1Id` int,
	`material1Meters` varchar(16),
	`material2Id` int,
	`material2Meters` varchar(16),
	`material3Id` int,
	`material3Meters` varchar(16),
	`hingeType` varchar(128),
	`drawerSlideType` varchar(128),
	`handleTypeLower` varchar(128),
	`handleTypeUpper` varchar(128),
	`chassisType` varchar(128),
	`plinthColor` varchar(64),
	`lightingColor` varchar(64),
	`glassColor` varchar(64),
	`innerBoxColor` varchar(64),
	`handleColor` varchar(64),
	`glassFrameColor` varchar(64),
	`marbleId` int,
	`marblePricePerMeter` int,
	`marbleMeters` varchar(16),
	`accessoriesJson` text,
	`claddingJson` text,
	`materialsTotalPrice` int DEFAULT 0,
	`accessoriesTotalPrice` int DEFAULT 0,
	`marbleTotalPrice` int DEFAULT 0,
	`claddingTotalPrice` int DEFAULT 0,
	`grandTotal` int DEFAULT 0,
	`notes` text,
	`status` enum('draft','sent','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kitchen_quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationId` int NOT NULL,
	`unitNumber` int NOT NULL,
	`location` enum('upper','lower','tall','placard','placard_deep') NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`totalArea` varchar(16) NOT NULL,
	`description` text,
	`materialId` int,
	`wallLabel` varchar(4),
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `kitchen_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_work_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quotationId` int NOT NULL,
	`workOrderCode` varchar(32) NOT NULL,
	`salesEngineer` varchar(128),
	`technicalEngineer` varchar(128),
	`contractDate` timestamp,
	`executionDate` timestamp,
	`deliveryDate` timestamp,
	`workOrderDate` timestamp,
	`doorCode1` varchar(64),
	`doorCode1Company` varchar(64),
	`doorCode2` varchar(64),
	`doorCode2Company` varchar(64),
	`doorCode3` varchar(64),
	`doorCode3Company` varchar(64),
	`lowerUnitsArea` varchar(16),
	`upperUnitsArea` varchar(16),
	`placardArea` varchar(16),
	`tallUnitsArea` varchar(16),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kitchen_work_orders_id` PRIMARY KEY(`id`)
);
