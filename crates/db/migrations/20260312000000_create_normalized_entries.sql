PRAGMA foreign_keys = ON;

CREATE TABLE normalized_entries (
    execution_id    BLOB NOT NULL,
    entry_index     INTEGER NOT NULL,
    entry_json      TEXT NOT NULL,
    inserted_at     TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    PRIMARY KEY (execution_id, entry_index),
    FOREIGN KEY (execution_id) REFERENCES execution_processes(id) ON DELETE CASCADE
);

CREATE INDEX idx_normalized_entries_execution_id ON normalized_entries(execution_id);
