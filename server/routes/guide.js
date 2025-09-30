import express from "express";
import path from "path";
import fs from "fs";

export const router = express.Router();

const publicDir = path.join(process.cwd(), "public");
const guidesDir = path.join(publicDir, "guides");

router.get("/_debug", (_req, res) => {
  let listing = [];
  try { listing = fs.readdirSync(guidesDir); } catch {}
  return res.json({ publicDir, guidesDir, listing });
});

router.get("/:id", (req, res) => {
  const id = String(req.params.id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const filePath = path.resolve(guidesDir, `${id}.html`);
  const exists = fs.existsSync(filePath);
  console.log("[/guide] resolve", { id, filePath, exists });
  if (!exists) return res.status(404).send("Guide not found.");
  const html = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, immutable");
  res.status(200).send(html);
});

