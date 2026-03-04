-- Enable Row Level Security on all public schema tables
--
-- INTENT: Supabase Security Advisor compliance (33 errors → 0 errors)
-- STRATEGY: Enable RLS with NO policies on every table.
--   - PostgREST (anon/authenticated role): deny-all by default (no policy = no access)
--   - Prisma / NestJS API (postgres superuser via DATABASE_URL): bypasses RLS entirely
--   - Supabase JS SDK (service_role key): bypasses RLS entirely
--   - Seed scripts (postgres superuser): bypasses RLS entirely
--
-- This is idempotent — safe to run on databases where RLS is already enabled.

-- Auth / Session tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;

-- Member / Points tables
ALTER TABLE "point_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member_level_configs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "member_level_history" ENABLE ROW LEVEL SECURITY;

-- Discount tables
ALTER TABLE "discount_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discount_usages" ENABLE ROW LEVEL SECURITY;

-- Review tables
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

-- Product tables
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;

-- Cart tables
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;

-- Order tables
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

-- Payment tables
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_logs" ENABLE ROW LEVEL SECURITY;

-- Refund tables
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;

-- Farm Tour tables
ALTER TABLE "farm_tours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "farm_tour_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "farm_tour_bookings" ENABLE ROW LEVEL SECURITY;

-- Location tables
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "location_images" ENABLE ROW LEVEL SECURITY;

-- Schedule tables
ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;

-- Social / Content tables
ALTER TABLE "social_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_alert_settings" ENABLE ROW LEVEL SECURITY;

-- Admin / System tables
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;
