// server/routes/plan.js
import express from "express";
export const router = express.Router();

// --- Minimal demo PlanSet (valid shape) ---
const demo = {
  user_profile: { starting_fico: 510, monthly_budget_usd: 100, constraints: ["soft pull only"] },
  plan_set: "A",
  plans: [
    {
      id: "planA",
      title: "Fastest Lift (30–60 days)",
      monthly_cost: 45,
      apps: [
        {
          app_name: "Dovly AI",
          app_url: "https://dovly.com",
          app_description: "Automated dispute resolution",
          app_category: "dispute_resolution",
          why_this_app: "Hands-off disputes with steady cadence",
          setup_time_min: 10,
          reports_to: ["Experian","Equifax","TransUnion"],
          steps: ["Create account", "Enable disputes", "Check weekly"],
          substitutes: [
            { app_name: "CreditVersio", reason: "If Dovly unavailable" },
            { app_name: "DisputeBee", reason: "Manual workflow alt" }
          ]
        },
        {
          app_name: "Experian Boost",
          app_url: "https://www.experian.com/consumer-products/boost.html",
          app_description: "Add utilities/streaming to file",
          app_category: "tradeline",
          why_this_app: "Fastest legal score bump for many users",
          setup_time_min: 8,
          reports_to: ["Experian"],
          steps: ["Connect bank", "Link eligible bills", "Re-run score"],
          substitutes: [{ app_name: "UltraFICO", reason: "Alt data if eligible" }]
        }
      ],
      weekly_actions: [
        { week: 1, actions: ["Enroll Dovly", "Run Experian Boost"] },
        { week: 2, actions: ["Open builder card", "Pay utility sync"] }
      ],
      expected_outcomes: {
        window_days: 45,
        fico_delta: [20, 60],
        assumptions: ["on-time payments", "utilization < 30%"]
      }
    },
    { id: "planB", title: "Balanced Stack", monthly_cost: 65, apps: [], weekly_actions: [{week:1,actions:["Start"]}], expected_outcomes:{window_days:60,fico_delta:[15,45],assumptions:["same"]} },
    { id: "planC", title: "Max Stack",      monthly_cost: 95, apps: [], weekly_actions: [{week:1,actions:["Start"]}], expected_outcomes:{window_days:90,fico_delta:[25,80],assumptions:["same"]} }
  ]
};

// POST /api/plan/generate  -> return demo for now
router.post("/generate", (req, res) => res.json({ ok: true, plan_id: "planA", data: demo }));

// GET /api/plan/:id        -> return the same demo for any id
router.get("/:id", (req, res) => res.json({ ok: true, data: demo }));

// TEMP catch-all so your Preview stops showing 404 while wiring
router.all("*", (req, res) => res.json({ ok: true, data: demo }));
