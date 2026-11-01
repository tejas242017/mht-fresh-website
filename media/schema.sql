CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved','rejected')),
  description TEXT,
  image_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  full_url TEXT,
  photographer TEXT NOT NULL,
  photographer_username TEXT,
  photographer_url TEXT NOT NULL,
  source_page_url TEXT NOT NULL,
  download_location TEXT NOT NULL,
  usage_location TEXT NOT NULL DEFAULT 'Unassigned',
  approved_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, source_id)
);
CREATE INDEX IF NOT EXISTS idx_media_status ON media_assets(status);
