CREATE TABLE IF NOT EXISTS brochure_visitors (
  store_id VARCHAR(64) NOT NULL,
  visitor_id CHAR(36) NOT NULL,
  first_visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id, visitor_id),
  INDEX idx_brochure_visitors_store (store_id),
  CONSTRAINT fk_brochure_visitors_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
