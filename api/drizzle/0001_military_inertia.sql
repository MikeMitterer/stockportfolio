ALTER TABLE `users` ADD `is_setup_account` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `legacy_imported` integer DEFAULT false NOT NULL;