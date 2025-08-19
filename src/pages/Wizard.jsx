import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setWizardData } from "../shared/useWizardData.js";
import ProgressBar from "../shared/ProgressBar.jsx";
import StepDots from "../shared/StepDots.jsx";

export default function Wizard() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    housing: "rent",
    subs: "Netflix",
    tools: "auto",
    employment: "employed",
    goal: "30",
    budget: "45",
    remix: false,
  });

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function onSubmit(e) {
    e.preventDefault();

    // normalize to the shape your API/tests expect
    const payload = {
      housing: form.housing,
      subs: form.subs
        ? form.subs.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      tools: form.tools,
      employment: form.employment,
      goal: form.goal, // "30" | "90" | "flexible"
      budget: Number(form.budget || 0),
      remix: !!form.remix,
    };

    setWizardData(payload);
    nav("/preview");
  }

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl bg-white rounded-2xl shadow p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Tell us a bit about you</h2>
          <ProgressBar value={50} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm text-slate-600">Housing</span>
            <select
              name="housing"
              value={form.housing}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="rent">Rent</option>
              <option value="mortgage">Mortgage</option>
              <option value="neither">Neither</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-600">Employment</span>
            <select
              name="employment"
              value={form.employment}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-600">Subscriptions (comma-sep)</span>
            <input
              name="subs"
              value={form.subs}
              onChange={onChange}
              placeholder="Netflix, Spotify"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-600">Tools style</span>
            <select
              name="tools"
              value={form.tools}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="auto">Automatic</option>
              <option value="manual">Manual</option>
              <option value="not-sure">Not sure</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-600">Goal</span>
            <select
              name="goal"
              value={form.goal}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="30">~30 days</option>
              <option value="90">~90 days</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-600">Monthly budget (USD)</span>
            <input
              name="budget"
              value={form.budget}
              onChange={onChange}
              type="number"
              min="0"
              step="1"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              name="remix"
              checked={form.remix}
              onChange={onChange}
              className="size-4"
            />
            <span>Give me a less typical mix</span>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <StepDots active={2} total={3} />
          <button className="rounded-xl bg-black text-white px-5 py-2">
            Continue
          </button>
        </div>
      </form>
    </main>
  );
}
