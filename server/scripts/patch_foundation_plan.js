import "dotenv/config";
import { query } from "../lib/pg.js";

async function run() {
  try {
    await query("BEGIN");

    // 1) Ensure plan 'foundation' exists (stable primary key)
    await query(`
      INSERT INTO plans (xata_id, title, status, plan_tier)
      VALUES ('foundation', 'Foundation', 'draft', 'A')
      ON CONFLICT (xata_id) DO NOTHING
    `);

    // 2) Repoint any entitlements that are NULL to 'foundation'
    await query(`UPDATE entitlements SET plan = 'foundation' WHERE plan IS NULL`);

    await query("COMMIT");

    // Sanity print
    const p = await query(`SELECT xata_id, title FROM plans WHERE xata_id='foundation'`);
    const e = await query(`SELECT COUNT(*)::int AS c FROM entitlements WHERE plan='foundation'`);
    console.log({ plan: p.rows[0], entitlements_pointing_to_foundation: e.rows[0].c });
  } catch (err) {
    await query("ROLLBACK").catch(() => {});
    console.error("patch failed:", err);
    process.exit(1);
  }
}

run();
