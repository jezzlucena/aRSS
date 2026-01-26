import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://arss:arss_dev_password@localhost:5432/arss',
  });

  const db = drizzle(pool);
  const client = await pool.connect();

  try {
    console.log('Running Drizzle migrations...');

    // Run Drizzle migrations (if any exist)
    try {
      await migrate(db, { migrationsFolder: './src/db/migrations' });
    } catch (err) {
      // If no drizzle migrations, continue
      console.log('No Drizzle migrations to run or already up to date');
    }

    // Run custom SQL migrations
    console.log('Running custom SQL migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        // Split by semicolons for multiple statements, but handle PL/pgSQL blocks
        const statements = splitSqlStatements(sql);

        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await client.query(statement);
            } catch (err: unknown) {
              // Ignore "already exists" errors
              const pgError = err as { code?: string; message?: string };
              if (pgError.code !== '42710' && pgError.code !== '42P07') {
                throw err;
              }
              console.log(`  Skipping (already exists): ${pgError.message?.slice(0, 50)}...`);
            }
          }
        }
      }
    }

    console.log('All migrations completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inFunction = false;

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('--')) {
      continue;
    }

    current += line + '\n';

    // Track if we're inside a function definition
    if (trimmed.includes('$$ LANGUAGE') || trimmed.includes('$$;')) {
      inFunction = false;
      statements.push(current.trim());
      current = '';
    } else if (trimmed.includes('AS $$')) {
      inFunction = true;
    } else if (!inFunction && trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
