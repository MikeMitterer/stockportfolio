CREATE TABLE `private_resources` (
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`resource_id` text NOT NULL,
	`revision` integer NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`owner_id`, `kind`, `resource_id`),
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
