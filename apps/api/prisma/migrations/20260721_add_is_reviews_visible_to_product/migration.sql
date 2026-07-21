-- Add is_reviews_visible column to products table
-- Controls whether customer reviews are shown publicly on the product page.
-- Defaults to true so existing products keep current behavior; admins can
-- toggle it off per-product to hide reviews from non-admin visitors.
ALTER TABLE "products" ADD COLUMN "is_reviews_visible" BOOLEAN NOT NULL DEFAULT true;
