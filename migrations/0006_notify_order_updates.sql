-- Task #16: notification preference for grocery order status updates.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_order_updates" boolean DEFAULT true NOT NULL;
