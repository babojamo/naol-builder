CREATE TABLE `builds` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`payload` text NOT NULL,
	`shared` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
