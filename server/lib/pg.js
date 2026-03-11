// server/lib/pg.js
import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

const WORKSPACE = process.env.XATA_PG_USER || "qpe9en";
const HOST      = process.env.XATA_PG_HOST || "us-east-1.sql.xata.sh";
const DB        = process.env.XATA_PG_DB   || "stackscore_core:main";
const KEY       = process.env.XATA_API_KEY;
if (!KEY) throw new Error("XATA_API_KEY missing");

export const pool = new Pool({
  user: WORKSPACE,
  host: HOST,
  database: DB,
  password: KEY,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

export async function query(sql, params = []) {
  const c = await pool.connect();
  try { return await c.query(sql, params); }
  finally { c.release(); }
}
