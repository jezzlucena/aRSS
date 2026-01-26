import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://arss:arss_dev_password@localhost:5432/arss',
});

export const db = drizzle(pool, { schema });

export * from './schema.js';
