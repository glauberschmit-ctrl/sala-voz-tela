CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`seen` integer NOT NULL,
	`mic` integer DEFAULT 0 NOT NULL,
	`screen` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_members_room` ON `members` (`room`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`mode` text NOT NULL,
	`host` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`target` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_signals_target_id` ON `signals` (`target`,`id`);--> statement-breakpoint
CREATE INDEX `idx_signals_created` ON `signals` (`created`);