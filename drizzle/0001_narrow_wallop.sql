CREATE TABLE `adCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`campaignName` varchar(128) NOT NULL,
	`campaignType` varchar(32) NOT NULL DEFAULT 'Spark Ads',
	`dailyBudget` double NOT NULL,
	`bidStrategy` varchar(64) NOT NULL,
	`audience` text,
	`triggerGpm` double NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`price` double NOT NULL,
	`sellingPoints` text NOT NULL,
	`thumbnailUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variant` varchar(32) NOT NULL,
	`strategy` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`hook` text,
	`pain` text,
	`cta` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`variant` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`hook` text,
	`thumbnailUrl` text,
	`videoUrl` text,
	`views` int NOT NULL DEFAULT 0,
	`completionRate` double NOT NULL DEFAULT 0,
	`engagementRate` double NOT NULL DEFAULT 0,
	`gpm` double NOT NULL DEFAULT 0,
	`ctr` double NOT NULL DEFAULT 0,
	`revenue` double NOT NULL DEFAULT 0,
	`status` enum('winner','normal','underperform') NOT NULL DEFAULT 'normal',
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `videos_id` PRIMARY KEY(`id`)
);
