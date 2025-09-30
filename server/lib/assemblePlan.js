import { query } from "./pg.js";

async function findPlanId({ plan_id, stackKey }) {
  if (plan_id) return plan_id;
  if (!stackKey) return null;
  const k = String(stackKey).trim().toLowerCase();
  const { rows } = await query(
    `SELECT xata_id
       FROM plans
      WHERE LOWER(xata_id) = $1
         OR LOWER(plan_code) = $1
         OR LOWER(title) = $1
      LIMIT 1`, [k]
  );
  return rows[0]?.xata_id || null;
}

export async function assemblePlanPg({ plan_id, stackKey }) {
  const pid = await findPlanId({ plan_id, stackKey });
  if (!pid) return { error: "Plan not found" };

  const plan = (await query(
    `SELECT xata_id AS id, title, plan_code, plan_tier, summary, status
       FROM plans WHERE xata_id = $1`, [pid]
  )).rows[0];

  const { rows } = await query(
    `SELECT a.xata_id AS id, a.app_name, a.app_url, a.app_description, a.app_category, a.is_active,
            pa.role, pa.sort_order, pa.position, pa.notes
       FROM plan_apps pa
       LEFT JOIN apps a ON a.xata_id = pa.app_id
      WHERE pa.plan_id = $1
   ORDER BY COALESCE(pa.sort_order, 9999), COALESCE(pa.position, 9999)`, [pid]
  );

  let selected = rows.slice(0, 5);

  if (selected.length < 3) {
    const existing = new Set(selected.map(r => r.id));
    const pad = await query(
      `SELECT xata_id AS id, app_name, app_url, app_description, app_category, is_active
         FROM apps WHERE is_active = TRUE LIMIT 20`
    );
    for (const a of pad.rows) {
      if (!existing.has(a.id)) {
        selected.push(a);
        existing.add(a.id);
        if (selected.length >= 3) break;
      }
    }
  }
  if (selected.length < 3) {
    return { error: "Plan has fewer than 3 apps after padding.", plan_id: pid, current_count: selected.length };
  }
  if (selected.length > 5) selected = selected.slice(0, 5);

  return {
    plan,
    apps: selected.map(a => ({
      id: a.id,
      app_name: a.app_name,
      app_url: a.app_url,
      app_description: a.app_description,
      app_category: a.app_category,
      is_active: a.is_active,
      role: a.role || "primary",
      sort_order: a.sort_order ?? a.position ?? null,
      notes: a.notes ?? null,
    })),
    counts: { apps: selected.length }
  };
}
