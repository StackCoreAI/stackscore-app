// server/routes/pdf-view.js
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");                    // server/
const APPROOT = path.resolve(ROOT, "..");                      // project root
const TEMPLATE_PATH = path.join(APPROOT, "public", "templates", "stacktemplate.html");
const PLAN_JSON_PATH = path.join(APPROOT, "plan.json");

// replace entire <script id="stacks-data">…</script> with our plan JSON
function embedStacksData(html, obj) {
  const safe = JSON.stringify(obj).replace(/</g, "\\u003c");
  return html.replace(
    /<script id="stacks-data"[^>]*>[\s\S]*?<\/script>/,
    `<script id="stacks-data" type="application/json">\n${safe}\n</script>`
  );
}

router.get("/pdf/view", async (req, res) => {
  try {
    const tpl = fs.readFileSync(TEMPLATE_PATH, "utf8");
    let plan = {};
    try { plan = JSON.parse(fs.readFileSync(PLAN_JSON_PATH, "utf8")); }
    catch { plan = { selected_stack_key: "elite", title: "Elite Stack Guide", services: [] }; }

    const html = embedStacksData(tpl, plan);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
  } catch (err) {
    console.error("pdf/view error:", err);
    res.status(500).send("Template load error");
  }
});

export default router;
