ALTER TABLE products ADD COLUMN image_storage_key VARCHAR(512) NULL;
ALTER TABLE brochure_items ADD COLUMN category VARCHAR(80) NULL;
ALTER TABLE brochure_items ADD COLUMN crop_box JSON NULL;
ALTER TABLE brochure_items ADD COLUMN crop_storage_key VARCHAR(512) NULL;
