ALTER TABLE store_listings
  ADD COLUMN valid_from DATE NULL AFTER verification_status,
  ADD COLUMN valid_until DATE NULL AFTER valid_from;

ALTER TABLE offer_requests
  ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'Other' AFTER brand,
  ADD COLUMN locality VARCHAR(120) NOT NULL DEFAULT '' AFTER category;
