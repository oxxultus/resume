ALTER TABLE posts ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS post_likes (
    path TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (path, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_posts_likes ON posts (likes DESC);
