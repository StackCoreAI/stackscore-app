// server/scripts/seed_pg.js
import "dotenv/config";
import fs from "fs/promises";
import { query } from "../lib/pg.js";

async function readJSON(name) {
  try {
    const buf = await fs.readFile(new URL(`../../seeds/${name}`, import.meta.url));
    return JSON.parse(buf.toString());
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

async function seedApps(apps) {
  if (!apps.length) return;
  const sql = `
    INSERT INTO apps (xata_id, app_name, app_url, app_description, app_category, is_active)
    VALUES ${apps.map((_, i) =>
      `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, $${i*6+6})`
    ).join(",")}
    ON CONFLICT (xata_id) DO UPDATE SET
      app_name = EXCLUDED.app_name,
      app_url = EXCLUDED.app_url,
      app_description = EXCLUDED.app_description,
      app_category = EXCLUDED.app_category,
      is_active = EXCLUDED.is_active
  `;
  const params = apps.flatMap(a => [
    a.id ?? a.app_name, a.app_name ?? null, a.app_url ?? null,
    a.app_description ?? null, a.app_category ?? null, a.is_active ?? true
  ]);
  await query(sql, params);
}

async function seedPlans(plans) {
  if (!plans.length) return;
  const sql = `
    INSERT INTO plans (xata_id, title, summary, status, plan_tier, build_id, preview_json)
    VALUES ${plans.map((_, i) =>
      `($${i*7+1}, $${i*7+2}, $${i*7+3}, $${i*7+4}, $${i*7+5}, $${i*7+6}, $${i*7+7})`
    ).join(",")}
    ON CONFLICT (xata_id) DO UPDATE SET
      title = EXCLUDED.title,
      summary = EXCLUDED.summary,
      status = EXCLUDED.status,
      plan_tier = EXCLUDED.plan_tier,
      build_id = EXCLUDED.build_id,
      preview_json = EXCLUDED.preview_json
  `;
  const params = plans.flatMap(p => [
    p.id, p.title ?? null, p.summary ?? null,
    p.status ?? "draft", p.plan_tier ?? "A",
    p.build_id ?? null, p.preview_json ?? null
  ]);
  await query(sql, params);
}

async function seedPlanApps(rows) {
  if (!rows.length) return;
  // plan_id/app_id are Xata links stored by xata as text ids in "xata_id" of target table
  const enriched = rows.map(r => ({ id: `${r.plan_id}_${r.app_id}`, ...r }));
  const sql = `
    INSERT INTO plan_apps (xata_id, plan_id, app_id, role, sort_order, notes, is_locked, position)
    VALUES ${enriched.map((_, i) =>
      `($${i*8+1}, $${i*8+2}, $${i*8+3}, $${i*8+4}, $${i*8+5}, $${i*8+6}, $${i*8+7}, $${i*8+8})`
    ).join(",")}
    ON CONFLICT (xata_id) DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      app_id = EXCLUDED.app_id,
      role = EXCLUDED.role,
      sort_order = EXCLUDED.sort_order,
      notes = EXCLUDED.notes,
      is_locked = EXCLUDED.is_locked,
      position = EXCLUDED.position
  `;
  const params = enriched.flatMap(r => [
    r.id, r.plan_id, r.app_id, r.role ?? "primary",
    r.sort_order ?? 1, r.notes ?? null, r.is_locked ?? true, r.position ?? 1
  ]);
  await query(sql, params);
}

async function seedEntitlements(rows) {
  if (!rows.length) return;
  // Link column is "plan" (link → plans). Store the target xata_id string.
  const enriched = rows.map(r => ({
    id: r.id ?? r.email,
    email: r.email,
    plan: typeof r.plan === "string" ? r.plan : r.plan?.id,
    product_id: r.product_id ?? null,
    stripe_customer_id: r.stripe_customer_id ?? null,
    stripe_price_id: r.stripe_price_id ?? null,
    stripe_payment_intent_id: r.stripe_payment_intent_id ?? null,
    stripe_charge_id: r.stripe_charge_id ?? null,
    status: r.status ?? "pending",
    shortio_link: r.shortio_link ?? null,
    purchase_at: r.purchase_at ?? null,
    expires_at: r.expires_at ?? null,
    last_event_id: r.last_event_id ?? null,
  }));

  const sql = `
    INSERT INTO entitlements
      (xata_id, email, plan, product_id, stripe_customer_id, stripe_price_id,
       stripe_payment_intent_id, stripe_charge_id, status, shortio_link,
       purchase_at, expires_at, last_event_id)
    VALUES ${enriched.map((_, i) =>
      `($${i*13+1},$${i*13+2},$${i*13+3},$${i*13+4},$${i*13+5},$${i*13+6},$${i*13+7},$${i*13+8},$${i*13+9},$${i*13+10},$${i*13+11},$${i*13+12},$${i*13+13})`
    ).join(",")}
    ON CONFLICT (xata_id) DO UPDATE SET
      email = EXCLUDED.email,
      plan = EXCLUDED.plan,
      product_id = EXCLUDED.product_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id,
      stripe_charge_id = EXCLUDED.stripe_charge_id,
      status = EXCLUDED.status,
      shortio_link = EXCLUDED.shortio_link,
      purchase_at = EXCLUDED.purchase_at,
      expires_at = EXCLUDED.expires_at,
      last_event_id = EXCLUDED.last_event_id
  `;
  const params = enriched.flatMap(r => [
    r.id, r.email, r.plan, r.product_id, r.stripe_customer_id, r.stripe_price_id,
    r.stripe_payment_intent_id, r.stripe_charge_id, r.status, r.shortio_link,
    r.purchase_at, r.expires_at, r.last_event_id
  ]);
  await query(sql, params);
}

async function main() {
  const [apps, plans, plan_apps, entitlements] = await Promise.all([
    readJSON("apps.json"),
    readJSON("plans.json"),
    readJSON("plan_apps.json"),
    readJSON("entitlements.json"),
  ]);

  // Order matters: parent rows first
  await seedApps(apps);
  await seedPlans(plans);
  await seedPlanApps(plan_apps);
  await seedEntitlements(entitlements);

  // Counts (via SQL)
  const [a, p, pa, e] = await Promise.all([
    query("SELECT COUNT(*)::int AS c FROM apps"),
    query("SELECT COUNT(*)::int AS c FROM plans"),
    query("SELECT COUNT(*)::int AS c FROM plan_apps"),
    query("SELECT COUNT(*)::int AS c FROM entitlements"),
  ]);
  console.log({
    apps: a.rows[0].c,
    plans: p.rows[0].c,
    plan_apps: pa.rows[0].c,
    entitlements: e.rows[0].c,
  });
}

main().catch(err => { console.error("PG seed failed:", err); process.exit(1); });
