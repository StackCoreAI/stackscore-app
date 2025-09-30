// pages/api/gpt-plan.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { z } from 'zod';
import { Plan, Service } from '@/lib/plan-schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const Body = z.object({
  stackKey: z.enum(['foundation','accelerator','growth','elite']).default('elite'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  value_props: z.array(z.string()).optional(),
  answers: z.record(z.any()).optional(), // your wizard inputs
});

function sanitize(s: any): Service {
  const arr = (x:any)=>Array.isArray(x)?x.filter(Boolean):[];
  return {
    name: String(s?.name || '').slice(0,120),
    type: String(s?.type || '').slice(0,80),
    cost: String(s?.cost || '').slice(0,40),
    site: String(s?.site || ''),
    steps: arr(s?.steps).map((t:string)=>String(t).slice(0,300)).slice(0,7),
    verification_check: String(s?.verification_check || '').slice(0,300),
    time_to_first_report: String(s?.time_to_first_report || '').slice(0,60),
    risk_flags: arr(s?.risk_flags).map((t:string)=>String(t).slice(0,100)).slice(0,6),
    fallbacks: arr(s?.fallbacks).map((t:string)=>String(t).slice(0,60)).slice(0,4),
  } as Service;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stackKey, title, subtitle, value_props, answers } = Body.parse(req.body || {});

    // TODO: enforce purchase (Stripe / JWT) before generating.
    const system = `Return ONLY JSON for a single credit-building plan with EXACT fields:
{ "services": [ { "name","type","cost","site","steps":[],"verification_check","time_to_first_report","risk_flags":[],"fallbacks":[] } ] }.
3–5 services total. Steps must be concrete actions. No extra prose.`;

    const user = { stackKey, constraints: { services_min:3, services_max:5, steps_min:3, steps_max:7 }, inputs: answers || {} };

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(user) },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = JSON.parse(r.choices[0].message!.content || '{}');
    const services = Array.isArray(raw.services) ? raw.services : [];
    const normalized = services.slice(0,5).map(sanitize);
    if (normalized.length < 3) return res.status(422).json({ error: 'PlanTooShort' });

    const plan = Plan.parse({
      selected_stack_key: stackKey,
      title: title || `${stackKey[0].toUpperCase()+stackKey.slice(1)} Stack Guide`,
      subtitle: subtitle || 'Your personalized activation plan with proven apps and clear steps',
      value_props: value_props || ['100+ point potential','30–60 day timeline','Premium coverage'],
      services: normalized,
      final_tip: {
        title: 'Pro Tip: lock in autopay + weekly checks',
        content: 'Enable autopay on every app, then check Experian and Credit Karma weekly. If a tradeline isn’t visible after two cycles, recheck connections or use a fallback from your plan.',
      },
      footer: { year: String(new Date().getFullYear()), tagline: 'Everything working in concert for maximum credit gains' },
    });

    // TODO: cache to DB by {userId, stackKey} if desired.

    res.status(200).json(plan);
  } catch (e:any) {
    res.status(500).json({ error: 'PlanGenerateFailed', message: e?.message || String(e) });
  }
}
