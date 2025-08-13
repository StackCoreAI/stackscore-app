import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold mb-3">StackScore</h1>
        <p className="text-slate-600 mb-6">
          Build a personalized credit-improvement plan in minutes.
        </p>
        <Link
          to="/wizard"
          className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-3"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
