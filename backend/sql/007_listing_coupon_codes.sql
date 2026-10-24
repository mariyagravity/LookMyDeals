ALTER TABLE store_listings ADD COLUMN coupon_code VARCHAR(50) NULL AFTER valid_until;
ALTER TABLE brochure_items ADD COLUMN coupon_code VARCHAR(50) NULL AFTER offer_price_minor;
ALTER TABLE brochures ADD COLUMN coupon_code VARCHAR(50) NULL AFTER expires_at;
