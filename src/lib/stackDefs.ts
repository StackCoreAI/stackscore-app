// Single source of truth for stack names, slugs, icons, accents
import { Layers, BarChart3, Rocket, Crown } from "lucide-react";

export const STACKS = [
  { key: "foundation", name: "Foundation", icon: Layers, accent: "ring-lime-400" },
  { key: "growth",     name: "Growth",     icon: BarChart3, accent: "ring-cyan-400" },
  { key: "accelerator",name: "Accelerator",icon: Rocket,    accent: "ring-sky-400" },
  { key: "elite",      name: "Elite",      icon: Crown,     accent: "ring-amber-400" },
];

export const byKey = Object.fromEntries(STACKS.map(s => [s.key, s]));
