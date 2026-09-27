CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`sender` text NOT NULL,
	`name` text NOT NULL,
	`client_id` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_room_id` ON `chat_messages` (`room`,`id`);--> statement-breakpoint
CREATE INDEX `idx_chat_sender_created` ON `chat_messages` (`room`,`sender`,`created`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chat_retry` ON `chat_messages` (`room`,`sender`,`client_id`);