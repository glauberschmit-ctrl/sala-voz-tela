CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created` integer NOT NULL,
	`event` text NOT NULL,
	`actor` text,
	`room` text,
	`status` integer NOT NULL,
	`detail` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_events` (`created`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `operational_counters` (
	`key` text PRIMARY KEY NOT NULL,
	`minute` integer NOT NULL,
	`route` text NOT NULL,
	`requests` integer DEFAULT 0 NOT NULL,
	`errors` integer DEFAULT 0 NOT NULL,
	`bytes_out` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`room` text NOT NULL,
	`reporter` text NOT NULL,
	`target` text NOT NULL,
	`reason` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_created` ON `reports` (`created`);--> statement-breakpoint
ALTER TABLE `members` ADD `suspended` integer DEFAULT 0 NOT NULL;