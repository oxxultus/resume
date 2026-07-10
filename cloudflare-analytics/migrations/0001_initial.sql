CREATE TABLE IF NOT EXISTS posts (
    path TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_page_views (
    day TEXT NOT NULL,
    path TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS daily_visitors (
    day TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    PRIMARY KEY (day, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_posts_views ON posts (views DESC);
CREATE INDEX IF NOT EXISTS idx_daily_visitors_day ON daily_visitors (day);
