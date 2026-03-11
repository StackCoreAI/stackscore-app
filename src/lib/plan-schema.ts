// lib/plan-schema.ts
import { z } from 'zod';

export const Service = z.object({
  name: z.string().min(1).max(120),
  type: z.string().min(1).max(80),
  cost: z.string().min(1).max(40),
  site: z.string().url().max(200),
  steps: z.array(z.string().min(1).max(300)).min(3).max(7),
  verification_check: z.string().min(1).max(300),
  time_to_first_report: z.string().min(1).max(60),
  risk_flags: z.array(z.string().min(1).max(100)).max(6).default([]),
  fallbacks: z.array(z.string().min(1).max(60)).max(4).default([]),
});

export const Plan = z.object({
  selected_stack_key: z.enum(['foundation', 'accelerator', 'growth', 'elite']),
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(160),
  value_props: z.array(z.string()).min(1).max(6),
  services: z.array(Service).min(3).max(5),
  final_tip: z.object({ title: z.string(), content: z.string() }),
  footer: z.object({ year: z.string(), tagline: z.string() }),
});

export type Plan = z.infer<typeof Plan>;
export type Service = z.infer<typeof Service>;
