CREATE TABLE `pricing_basket_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`brandId` int NOT NULL,
	`spaceId` int NOT NULL,
	`productId` int NOT NULL,
	`productTypeId` int NOT NULL,
	`selectedVariables` text NOT NULL,
	`complexityLevel` enum('basic','standard','premium','custom') NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`basePrice` int NOT NULL,
	`materialsTotal` int NOT NULL DEFAULT 0,
	`addonsTotal` int NOT NULL DEFAULT 0,
	`complexityMultiplier` varchar(8) NOT NULL,
	`finalPrice` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_basket_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`systemType` enum('product','modular','area','catalog') NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pricing_brands_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_brands_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pricing_complexity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productTypeId` int NOT NULL,
	`level` enum('basic','standard','premium','custom') NOT NULL,
	`nameAr` varchar(64) NOT NULL,
	`multiplier` varchar(8) NOT NULL,
	`description` text,
	CONSTRAINT `pricing_complexity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_product_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`basePrice` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pricing_product_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spaceId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pricing_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_quotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`quotationNumber` varchar(32) NOT NULL,
	`clientName` varchar(128),
	`projectName` varchar(128),
	`engineerName` varchar(128),
	`totalAmount` int NOT NULL,
	`notes` text,
	`status` enum('draft','sent','approved') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_quotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_spaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pricing_spaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_variables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productTypeId` int NOT NULL,
	`category` enum('dimension','material','fabric','finish','hardware','addon') NOT NULL,
	`code` varchar(64) NOT NULL,
	`nameAr` varchar(128) NOT NULL,
	`nameEn` varchar(128) NOT NULL,
	`priceModifier` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `pricing_variables_id` PRIMARY KEY(`id`)
);
