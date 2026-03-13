use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use uuid::Uuid;

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct NormalizedEntry {
    pub execution_id: Uuid,
    pub entry_index: i64,
    pub entry_json: String,
    pub inserted_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedEntries {
    pub entries: Vec<NormalizedEntry>,
    pub total_count: i64,
    pub has_more: bool,
}

impl NormalizedEntry {
    /// Insert a batch of normalized entries for an execution process
    pub async fn insert_batch(
        pool: &SqlitePool,
        execution_id: Uuid,
        entries: &[(i64, String)], // (entry_index, entry_json)
    ) -> Result<(), sqlx::Error> {
        if entries.is_empty() {
            return Ok(());
        }

        // Use a transaction for batch insert
        let mut tx = pool.begin().await?;

        for (entry_index, entry_json) in entries {
            sqlx::query!(
                r#"INSERT INTO normalized_entries (execution_id, entry_index, entry_json)
                   VALUES ($1, $2, $3)
                   ON CONFLICT(execution_id, entry_index) DO UPDATE SET
                       entry_json = excluded.entry_json"#,
                execution_id,
                entry_index,
                entry_json
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    /// Find entries for an execution process with pagination
    /// offset: number of entries to skip
    /// limit: maximum number of entries to return
    pub async fn find_by_execution_id_paginated(
        pool: &SqlitePool,
        execution_id: Uuid,
        offset: i64,
        limit: i64,
    ) -> Result<PaginatedEntries, sqlx::Error> {
        // Get total count
        let total_count = Self::count_by_execution_id(pool, execution_id).await?;

        // Get paginated entries
        let entries = sqlx::query_as!(
            NormalizedEntry,
            r#"SELECT
                execution_id as "execution_id!: Uuid",
                entry_index,
                entry_json,
                inserted_at as "inserted_at!: DateTime<Utc>"
               FROM normalized_entries
               WHERE execution_id = $1
               ORDER BY entry_index ASC
               LIMIT $2 OFFSET $3"#,
            execution_id,
            limit,
            offset
        )
        .fetch_all(pool)
        .await?;

        let has_more = (offset + limit) < total_count;

        Ok(PaginatedEntries {
            entries,
            total_count,
            has_more,
        })
    }

    /// Count total entries for an execution process
    pub async fn count_by_execution_id(
        pool: &SqlitePool,
        execution_id: Uuid,
    ) -> Result<i64, sqlx::Error> {
        let row = sqlx::query!(
            r#"SELECT COUNT(*) as "count: i64"
               FROM normalized_entries
               WHERE execution_id = $1"#,
            execution_id
        )
        .fetch_one(pool)
        .await?;

        Ok(row.count)
    }

    /// Check if normalized entries exist for an execution process
    pub async fn exists_for_execution_id(
        pool: &SqlitePool,
        execution_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let count = Self::count_by_execution_id(pool, execution_id).await?;
        Ok(count > 0)
    }

    /// Delete all entries for an execution process
    pub async fn delete_by_execution_id(
        pool: &SqlitePool,
        execution_id: Uuid,
    ) -> Result<u64, sqlx::Error> {
        let result = sqlx::query!(
            "DELETE FROM normalized_entries WHERE execution_id = $1",
            execution_id
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}
