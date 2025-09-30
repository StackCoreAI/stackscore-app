// server/api/gpt-plan.js (ESM)
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sanitize = (s = {}) => {
  const arr = x => Array.isArray(x) ? x.filter(Boolean) : [];
  return {
    name: String(s.name || '').slice(0, 120),
    type: String(s.type || '').slice(0, 80),
    cost: String(s.cost || '').slice(0, 40),
    site: String(s.site || ''),
    steps: arr(s.steps).map(t => String(t).slice(0, 300)).slice(0, 7),
    verification_check: String(s.verification_check || '').slice(0, 300),
    time_to_first_report: String(s.time_to_first_report || '').slice(0, 60),
    risk_flags: arr(s.risk_flags).map(t => String(t).slice(0, 100)).slice(0, 6),
    fallbacks: arr(s.fallbacks).map(t => String(t).slice(0, 60)).slice(0, 4),
  };
};

export default async function gptPlan(req, res) {
  try {
    const body = req.body || {};
    const stackKey = (body.stackKey || 'elite').toLowerCase();

    // TODO: verify purchase/session here.

    const system = `Return ONLY JSON for a single credit-building plan with EXACT fields:
{"services":[{"name","type","cost","site","steps","verification_check","time_to_first_report","risk_flags","fallbacks"}]}
- 3–5 services total
- Steps must be concrete actions
- No extra prose.`;

    const user = {
      stackKey,
      constraints: { services_min: 3, services_max: 5, steps_min: 3, steps_max: 7 },
      inputs: body.answers || {}
    };

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: JSON.stringify(user) }
      ],
      response_format: { type: 'json_object' }
    });

    const raw = JSON.parse(r.choices[0].message.content || '{}');
    const services = Array.isArray(raw.services) ? raw.services : [];
    const normalized = services.slice(0, 5).map(sanitize);

    if (normalized.length < 3) {
      return res.status(422).json({ error: 'PlanTooShort', message: 'GPT returned fewer than 3 services.' });
    }

    const plan = {
      selected_stack_key: stackKey,
      title: body.title || `${stackKey[0].toUpperCase()}${stackKey.slice(1)} Stack Guide`,
      subtitle: body.subtitle || 'Your personalized activation plan with proven apps and clear steps',
      value_props: body.value_props || ['100+ point potential','30–60 day timeline','Premium coverage'],
      services: normalized,
      final_tip: {
        title: 'Pro Tip: lock in autopay + weekly checks',
        content: 'Enable autopay on every app, then check Experian and Credit Karma weekly. If a tradeline isn’t visible after two cycles, recheck connections or use a fallback from your plan.'
      },
      footer: { year: String(new Date().getFullYear()), tagline: 'Everything working in concert for maximum credit gains' }
    };

    res.status(200).json(plan);
  } catch (err) {
    console.error('gpt-plan error:', err);
    res.status(500).json({ error: 'PlanGenerateFailed', message: String(err?.message || err) });
  }
}
