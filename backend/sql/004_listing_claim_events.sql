CREATE TABLE IF NOT EXISTS listing_claim_events (
  id VARCHAR(64) PRIMARY KEY,
  listing_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_listing_claim_events_store (store_id),
  INDEX idx_listing_claim_events_listing (listing_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
