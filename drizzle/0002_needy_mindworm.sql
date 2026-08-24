CREATE TABLE `pmec_notifications` (
	`id` varchar(64) NOT NULL,
	`employee_id` varchar(96) NOT NULL,
	`type` enum('assignment','time_approved') NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` text NOT NULL,
	`route` varchar(160) NOT NULL,
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pmec_notifications_id` PRIMARY KEY(`id`)
);
