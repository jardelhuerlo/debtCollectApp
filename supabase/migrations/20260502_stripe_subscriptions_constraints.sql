-- Add unique constraint on user_id for upsert to work
ALTER TABLE stripe_subscriptions ADD CONSTRAINT stripe_subscriptions_user_id_key UNIQUE (user_id);

-- Add indexes for efficient webhook lookups
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_subscription_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_customer_id ON stripe_subscriptions(stripe_customer_id);
