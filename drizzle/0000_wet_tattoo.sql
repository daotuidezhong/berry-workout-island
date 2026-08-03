CREATE TABLE `checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`date` text NOT NULL,
	`activity` text NOT NULL,
	`minutes` integer,
	`calories` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_checkins_device_date` ON `checkins` (`device_id`,`date`);