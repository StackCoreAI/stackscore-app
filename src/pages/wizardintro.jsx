// src/pages/wizardIntro.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function WizardIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <SiteHeader />

      <main className="flex-grow flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-8">

          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-500/10 px-3 py-1 text-xs text-lime-300">
            CreditRoute Mapping
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Let’s Map Your <span className="text-lime-400">CreditRoute</span>
          </h1>

          <p className="text-neutral-300 text-lg">
            In under 60 seconds, we’ll identify the strongest combination of reporting features across multiple apps — and show you your four possible CreditRoutes.
          </p>

          <div className="space-y-3 text-sm text-neutral-400">
            <p>• No credit pull</p>
            <p>• No sensitive financial data</p>
            <p>• Personalized to your situation</p>
          </div>

          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/wizard?fresh=1")}
              className="bg-gradient-to-r from-lime-500 to-emerald-500 shadow-lg shadow-lime-500/30"
            >
              Start the 6 Questions
            </Button>
          </div>

          <p className="text-xs text-neutral-500">
            You’ll preview your routes before unlocking anything.
          </p>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
