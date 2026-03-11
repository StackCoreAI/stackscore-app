import { Router } from "express";
import { assemblePlanPg } from "../lib/assemblePlanPg.js";

const r = Router();

function noStore(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

/** Normalize and send the plan payload */
function sendPlan(res, payload) {
  noStore(res);
  if (!payload || payload.error) {
    return res.status(422).json(payload || { error: "Plan not found" });
  }
  return res.json(payload);
}

/** POST /api/gpt-plan  { plan_id?: string, stackKey?: string } */
r.post("/gpt-plan", async (req, res) => {
  try {
    const body = req.body || {};
    const payload = await assemblePlanPg(body);
    return sendPlan(res, payload);
  } catch (e) {
    console.error("gpt-plan (pg) POST failed:", e);
    noStore(res);
    return res.status(500).json({ error: "Internal error" });
  }
});

/** GET /api/gpt-plan?plan_id=<id>&stackKey=<code-or-title>
 *  Handy for manual/browser testing, e.g.:
 *  http://localhost:3001/api/gpt-plan?stackKey=foundation
 */
r.get("/gpt-plan", async (req, res) => {
  try {
    const { plan_id, stackKey } = req.query || {};
    const payload = await assemblePlanPg({ plan_id, stackKey });
    return sendPlan(res, payload);
  } catch (e) {
    console.error("gpt-plan (pg) GET failed:", e);
    noStore(res);
    return res.status(500).json({ error: "Internal error" });
  }
});

export default r;
