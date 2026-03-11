// server/scripts/sanity.js
import "dotenv/config";
import fetch from "node-fetch";

const DB_URL =
  "https://Jey-Fam-s-workspace-qpe9en.us-east-1.xata.sh/db/stackscore_core:main";

const headers = {
  "Authorization": `Bearer ${process.env.XATA_API_KEY}`,
  "Content-Type": "application/json",
};

async function count(table) {
  // lightweight paginated query returns totalCount
  const res = await fetch(`${DB_URL}/tables/${table}/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ page: { size: 1 } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Count failed for ${table}: ${res.status} ${text}`);
  }
  const data = await res.json();
  return typeof data?.meta?.page?.totalCount === "number"
    ? data.meta.page.totalCount
    : (Array.isArray(data?.records) ? data.records.length : 0);
}

try {
  const [apps, plans, plan_apps, entitlements] = await Promise.all([
    count("apps"),
    count("plans"),
    count("plan_apps"),
    count("entitlements"),
  ]);
  console.log({ apps, plans, plan_apps, entitlements });
  process.exit(0);
} catch (err) {
  console.error("Sanity check failed:", err.message);
  process.exit(1);
}
