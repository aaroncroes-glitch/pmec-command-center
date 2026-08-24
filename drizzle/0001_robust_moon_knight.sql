CREATE TABLE `pmec_assignments` (
	`id` varchar(64) NOT NULL,
	`job_order_id` varchar(96) NOT NULL,
	`job_order_title` varchar(255) NOT NULL,
	`task_id` varchar(96) NOT NULL,
	`task_title` varchar(255) NOT NULL,
	`employee_id` varchar(96) NOT NULL,
	`employee_name` varchar(160) NOT NULL,
	`discipline` varchar(96) NOT NULL,
	`status` enum('assigned','in_progress','blocked','complete') NOT NULL DEFAULT 'assigned',
	`progress` int NOT NULL DEFAULT 0,
	`assigned_by` varchar(160) NOT NULL,
	`due_date` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmec_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pmec_time_logs` (
	`id` varchar(64) NOT NULL,
	`assignment_id` varchar(64) NOT NULL,
	`employee_id` varchar(96) NOT NULL,
	`employee_name` varchar(160) NOT NULL,
	`job_order_id` varchar(96) NOT NULL,
	`task_id` varchar(96) NOT NULL,
	`work_date` varchar(10) NOT NULL,
	`minutes` int NOT NULL,
	`note` text NOT NULL,
	`status` enum('submitted','approved','rejected') NOT NULL DEFAULT 'submitted',
	`reviewer_note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmec_time_logs_id` PRIMARY KEY(`id`)
);
