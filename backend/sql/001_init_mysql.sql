-- LookMyDeals MVP schema for MySQL 8 / MariaDB 10.4+.
-- Run against the already-created `lookmydeals` database.

CREATE TABLE IF NOT EXISTS stores (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  locality VARCHAR(120) NOT NULL,
  pin_code CHAR(6) NOT NULL,
  address TEXT NULL,
  verification_status ENUM('demo', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'demo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stores_pin_code (pin_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(120) NULL,
  category VARCHAR(80) NOT NULL,
  pack_size VARCHAR(80) NULL,
  unit VARCHAR(40) NULL,
  barcode VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_listings (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  listed_price_minor BIGINT UNSIGNED NOT NULL,
  offer_price_minor BIGINT UNSIGNED NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  source_type ENUM('demo', 'retailer', 'external_serp', 'brochure') NOT NULL DEFAULT 'demo',
  verification_status ENUM('demo', 'pending_review', 'verified', 'rejected', 'expired') NOT NULL DEFAULT 'demo',
  source_url TEXT NULL,
  price_checked_at DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_listings_product (product_id),
  INDEX idx_store_listings_store (store_id),
  CONSTRAINT fk_store_listings_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_store_listings_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_store_listing_offer_price CHECK (offer_price_minor IS NULL OR offer_price_minor <= listed_price_minor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offers (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  offer_price_minor BIGINT UNSIGNED NULL,
  valid_from DATE NULL,
  valid_until DATE NULL,
  status ENUM('draft', 'pending_review', 'published', 'expired', 'rejected') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offers_store_status (store_id, status),
  CONSTRAINT fk_offers_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_offers_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_claims (
  id VARCHAR(64) PRIMARY KEY,
  offer_id VARCHAR(64) NOT NULL,
  claim_code_hash VARCHAR(255) NOT NULL,
  status ENUM('demo', 'issued', 'redeemed', 'expired', 'cancelled') NOT NULL DEFAULT 'demo',
  claimed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  notification_status ENUM('not_sent', 'queued', 'sent', 'delivered', 'failed', 'simulated') NOT NULL DEFAULT 'not_sent',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_offer_claim_code_hash (claim_code_hash),
  INDEX idx_offer_claims_offer_status (offer_id, status),
  CONSTRAINT fk_offer_claims_offer FOREIGN KEY (offer_id) REFERENCES offers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminder_lists (
  id VARCHAR(64) PRIMARY KEY,
  visitor_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminder_list_items (
  id VARCHAR(64) PRIMARY KEY,
  reminder_list_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reminder_items_list (reminder_list_id),
  CONSTRAINT fk_reminder_items_list FOREIGN KEY (reminder_list_id) REFERENCES reminder_lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_reminder_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_reminder_items_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT chk_reminder_item_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_requests (
  id VARCHAR(64) PRIMARY KEY,
  item_name VARCHAR(200) NOT NULL,
  brand VARCHAR(120) NULL,
  pin_code CHAR(6) NOT NULL,
  target_price_minor BIGINT UNSIGNED NULL,
  contact_reference VARCHAR(255) NULL,
  status ENUM('open', 'responded', 'closed', 'spam') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offer_requests_pin_status (pin_code, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brochures (
  id VARCHAR(64) PRIMARY KEY,
  store_id VARCHAR(64) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes BIGINT UNSIGNED NOT NULL,
  processing_status ENUM('uploaded', 'processing', 'needs_review', 'failed', 'approved', 'rejected') NOT NULL DEFAULT 'uploaded',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  INDEX idx_brochures_store_status (store_id, processing_status),
  CONSTRAINT fk_brochures_store FOREIGN KEY (store_id) REFERENCES stores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brochure_items (
  id VARCHAR(64) PRIMARY KEY,
  brochure_id VARCHAR(64) NOT NULL,
  page_number SMALLINT UNSIGNED NULL,
  product_name VARCHAR(200) NOT NULL,
  brand VARCHAR(120) NULL,
  pack_size VARCHAR(80) NULL,
  listed_price_minor BIGINT UNSIGNED NULL,
  offer_price_minor BIGINT UNSIGNED NULL,
  valid_from DATE NULL,
  valid_until DATE NULL,
  confidence DECIMAL(4,3) NULL,
  review_status ENUM('needs_review', 'approved', 'rejected') NOT NULL DEFAULT 'needs_review',
  review_notes TEXT NULL,
  published_listing_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_brochure_items_brochure_status (brochure_id, review_status),
  CONSTRAINT fk_brochure_items_brochure FOREIGN KEY (brochure_id) REFERENCES brochures(id) ON DELETE CASCADE,
  CONSTRAINT fk_brochure_items_listing FOREIGN KEY (published_listing_id) REFERENCES store_listings(id) ON DELETE SET NULL,
  CONSTRAINT chk_brochure_item_confidence CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS external_search_cache (
  query_hash CHAR(64) PRIMARY KEY,
  normalized_query VARCHAR(120) NOT NULL,
  provider VARCHAR(40) NOT NULL,
  response_json LONGTEXT NOT NULL,
  fetched_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  INDEX idx_external_cache_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
