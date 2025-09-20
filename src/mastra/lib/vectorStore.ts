// lib/vectorStore.ts
import { Pool } from 'pg';

// Create a Postgres pool using your connection string
const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

export const vectorStore = {
  add: async ({
    id,
    values,
    metadata,
  }: {
    id: string;
    values: number[];
    metadata?: Record<string, any>;
  }) => {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO documents (id, embedding, metadata)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata`,
        [id, values, metadata || {}]
      );
    } finally {
      client.release();
    }
  },

  search: async ({
    queryVector,
    topK = 5,
  }: {
    queryVector: number[];
    topK?: number;
  }) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, metadata, embedding <-> $1 AS distance
         FROM documents
         ORDER BY embedding <-> $1
         LIMIT $2`,
        [queryVector, topK]
      );
      return result.rows;
    } finally {
      client.release();
    }
  },
};
