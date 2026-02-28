import pg from "pg";

const { Pool } = pg;

if (!process.env.XATA_PG_URL) {
  console.error("❌ Missing XATA_PG_URL environment variable.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.XATA_PG_URL,
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 8000,
});

const sql = `
create table if not exists plan_cache (
  cache_key text primary key,
  stack_key text not null,
  answers_hash text not null,
  answers_json jsonb not null,
  response_json jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists idx_plan_cache_expires_at on plan_cache (expires_at);
`;

async function main() {
  try {
    await pool.query(sql);
    console.log("✅ plan_cache table + index created (or already exists).");
  } catch (e) {
    console.error("❌ Failed to create table:", e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();