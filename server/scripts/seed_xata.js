// server/scripts/seed_xata.js
import "dotenv/config";
import fs from "fs/promises";
import { XataClient } from "../../src/xata.js";

// Scrub any SDK env overrides
delete process.env.XATA_BRANCH;
delete process.env.XATA_DATABASE_URL;
delete process.env.XATA_WORKSPACE_URL;

// Pin your DB URL (includes :main)
const xata = new XataClient({
  apiKey: process.env.XATA_API_KEY,
  databaseURL:
    "https://Jey-Fam-s-workspace-qpe9en.us-east-1.xata.sh/db/stackscore_core:main",
});

async function readJSON(name) {
  try {
    const buf = await fs.readFile(new URL(`../../seeds/${name}`, import.meta.url));
    return JSON.parse(buf.toString());
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

async function count(table) {
  const res = await xata.db[table].getPaginated({ pagination: { size: 1 } });
  return typeof res.totalCount === "number" ? res.totalCount : (res.records?.length || 0);
}

async function maybeUpsert(table, rows) {
  if (!rows?.length) return;
  const c = await count(table);
  if (c > 0) return; // already seeded → skip noise
  await xata.db[table].createOrReplace(rows);
}

async function main() {
  const apps = await readJSON("apps.json");
  const plans = await readJSON("plans.json");
  const planAppsSrc = await readJSON("plan_apps.json");
  const entitlementsSrc = await readJSON("entitlements.json");

  const planApps = planAppsSrc?.map(r => ({ id: `${r.plan_id}_${r.app_id}`, ...r })) ?? [];

  const entitlements = (entitlementsSrc ?? []).map(r => ({
    id: r.id || r.email,
    ...r, // SDK accepts link as "plan": "foundation" or { id:"foundation" }
  }));

  await maybeUpsert("apps", apps);
  await maybeUpsert("plans", plans);
  await maybeUpsert("plan_apps", planApps);
  await maybeUpsert("entitlements", entitlements);

  const [a, p, pa, e] = await Promise.all([
    count("apps"),
    count("plans"),
    count("plan_apps"),
    count("entitlements"),
  ]);
  console.log({ apps: a, plans: p, plan_apps: pa, entitlements: e });
}

main().catch(e => { console.error("Seed failed:", e); process.exit(1); });
