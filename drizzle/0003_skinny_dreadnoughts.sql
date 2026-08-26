ALTER TABLE `checkins` ADD `photo_key` text;--> statement-breakpoint
ALTER TABLE `checkins` ADD `photo_width` integer;--> statement-breakpoint
ALTER TABLE `checkins` ADD `photo_height` integer;--> statement-breakpoint
DROP INDEX IF EXISTS `idx_checkins_device_date`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_checkins_device_date_created` ON `checkins` (`device_id`,`date`,`created_at`);
