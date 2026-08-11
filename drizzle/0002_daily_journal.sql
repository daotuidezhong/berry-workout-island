PRAGMA foreign_keys=OFF;
CREATE TABLE `__new_checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`date` text NOT NULL,
	`activity` text NOT NULL,
	`category` text DEFAULT '其他' NOT NULL,
	`minutes` integer,
	`mood` text,
	`created_at` text NOT NULL
);
INSERT INTO `__new_checkins` (`id`, `device_id`, `date`, `activity`, `minutes`, `mood`, `created_at`) SELECT `id`, `device_id`, `date`, `activity`, `minutes`, `mood`, `created_at` FROM `checkins`;
DROP TABLE `checkins`;
ALTER TABLE `__new_checkins` RENAME TO `checkins`;
PRAGMA foreign_keys=ON;
