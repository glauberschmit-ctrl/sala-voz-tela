CREATE TABLE `friend_codes` (
	`account` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_codes_code_unique` ON `friend_codes` (`code`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`requester` text NOT NULL,
	`recipient` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`requester`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipient`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_friend_pair` ON `friendships` (`requester`,`recipient`);--> statement-breakpoint
CREATE TABLE `server_accounts` (
	`room` text NOT NULL,
	`account` text NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_server_account` ON `server_accounts` (`room`,`account`);--> statement-breakpoint
CREATE TABLE `voice_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_channels_room` ON `voice_channels` (`room`);--> statement-breakpoint
ALTER TABLE `members` ADD `channel` text DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `rooms` ADD `owner` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `permanent` integer DEFAULT 0 NOT NULL;