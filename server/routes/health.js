import { Router } from "express";
import { query } from "../lib/pg.js";

const r = Router();
const noStore = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

r.get("/health", async (_req, res) => {
  const t0 = Date.now();
  try {
    await query("SELECT 1");
    noStore(res);
    res.json({
      ok: true,
      db: "up",
      latency_ms: Date.now() - t0,
      time: new Date().toISOString(),
      version: process.env.APP_VERSION || "dev",
    });
  } catch (e) {
    console.error("health (pg) error:", e?.message || e);
    noStore(res);
    res.status(500).json({
      ok: false,
      db: "down",
      latency_ms: Date.now() - t0,
      time: new Date().toISOString(),
      version: process.env.APP_VERSION || "dev",
    });
  }
});

export default r;
