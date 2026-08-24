CREATE TABLE `pmec_notification_preferences` (
	`employee_id` varchar(96) NOT NULL,
	`assignments_enabled` int NOT NULL DEFAULT 1,
	`time_approved_enabled` int NOT NULL DEFAULT 1,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmec_notification_preferences_employee_id` PRIMARY KEY(`employee_id`)
);
--> statement-breakpoint
ALTER TABLE `pmec_notifications` ADD `archived_at` timestamp;