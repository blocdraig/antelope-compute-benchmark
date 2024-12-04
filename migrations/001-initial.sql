--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE results (
    id INTEGER PRIMARY KEY,
    payload TEXT NOT NULL,
    api TEXT NOT NULL,
    cpu_usage_us INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE results;
