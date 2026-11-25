UPDATE notifications SET href = '/dashboard' || href WHERE href LIKE '/messages/%';--> statement-breakpoint
UPDATE notifications SET href = '/dashboard/notifications' WHERE href = '/notifications';
