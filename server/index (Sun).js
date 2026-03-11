// server/index.js
import 'dotenv/config';
import express from 'express';
import magicLinks from './magicLinks.js';
import path from 'path';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import mustacheExpress from 'mustache-express';

const requiredEnv = ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_ID','STRIPE_SUCCESS_URL','STRIPE_CANCEL_URL'];
for (const k of requiredEnv) if (!process.env[k]) throw new Error(`Missing required env: ${k}`);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

const app = express();
const DEV = process.env.NODE_ENV !== 'production';
const STATIC_CACHE = DEV ? 'no-store' : 'public, max-age=31536000, immutable';

// paths / views
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, '..');
const distDir    = path.join(rootDir, 'dist');
const publicDir  = path.join(rootDir, 'public');
const serverViews = path.join(__dirname, 'templates');
const publicViews = path.join(publicDir, 'templates');

// view engine
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', [serverViews, publicViews]);
if (DEV) app.set('view cache', false);  // <— ensure templates reload in dev

// core middleware
app.use(compression());
app.use(rateLimit({ windowMs: 60_000, max: 180, standardHeaders: true, legacyHeaders: false }));
app.use(cookieParser());

// stripe webhook (raw body first)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const email = event.data.object?.customer_details?.email
        || event.data.object?.customer_email
        || event.data.object?.metadata?.email
        || null;
      if (email) console.log(`✅ Checkout completed for: ${email}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('❌ Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON after webhook
app.use(express.json({ limit: '2mb' }));

// service worker / manifest short cache
app.get(['/sw.js','/manifest.webmanifest'], (req,res,next) => { res.setHeader('Cache-Control','public, max-age=300'); next(); });

// static assets with dev/prod cache control
const setStaticCache = (res, p) => { if (/\.(css|js|woff2?|png|svg|jpg|jpeg|gif)$/.test(p)) res.setHeader('Cache-Control', STATIC_CACHE); };
app.use(express.static(distDir,   { setHeaders: setStaticCache }));
app.use(express.static(publicDir, { setHeaders: setStaticCache }));

// redirects
app.get('/guide/assets/*', (req,res) => res.redirect(301, req.path.replace(/^\/guide\/assets\//,'/assets/')));
app.get('/guide/manifest.webmanifest', (_req,res) => res.redirect(301, '/manifest.webmanifest'));
app.get('/guide/favicon.ico', (_req,res) => res.redirect(301, '/favicon.ico'));

// ===== helpers (kept local so routes can always call them) =====
function getWizardAnswers(req) {
  let a = null;
  try { if (req.query.answers) a = JSON.parse(String(req.query.answers)); } catch {}
  if (!a) { try { if (req.cookies?.ss_answers) a = JSON.parse(String(req.cookies.ss_answers)); } catch {} }
  return a || null;
}
function iconFor(appName=''){ const n=(appName||'').toLowerCase();
  if (n.includes('boost')) return 'zap';
  if (n.includes('kikoff')) return 'credit-card';
  if (n.includes('kovo')) return 'trending-up';
  if (n.includes('rent')) return 'home';
  if (n.includes('dispute')) return 'shield-check';
  return 'star';
}
function deriveSidebarApps(plans=[]){ const seen=new Set(), out=[];
  const add=a=>{ const n=(a?.app_name||'').trim(); if(!n||seen.has(n)) return; seen.add(n); out.push(a); };
  if (plans[0]?.apps) plans[0].apps.forEach(add);
  for (let i=1;i<plans.length&&out.length<5;i++) (plans[i].apps||[]).forEach(add);
  const fallbacks=[{app_name:'Experian Boost',app_url:'https://www.experian.com/boost'},
                   {app_name:'Kikoff',app_url:'https://www.kikoff.com/'},
                   {app_name:'Kovo',app_url:'https://www.kovo.com/'}];
  for (const f of fallbacks){ if(out.length>=3) break; if(!seen.has(f.app_name)) out.push(f); }
  return out.slice(0,5);
}
function buildSidebarHtml(apps=[]){
  return apps.map((a,i)=>`
<details class="group"${i===0?' open':''}>
  <summary class="w-full flex items-center justify-between px-3 py-2 bg-lime-600 text-black rounded-md hover:bg-lime-500 transition-colors text-xs font-medium cursor-pointer"
    data-app="${a.app_name||a.name||'App'}" data-url="${a.app_url||a.url||''}"
    data-step1="${a.step1||'Instant Credit Score Boost'}"
    data-step2="${a.step2||'Connect Bank'}"
    data-step3="${a.step3||'Add Utilities'}">
    <span class="flex items-center space-x-1.5"><i data-lucide="${iconFor(a.app_name)}" class="w-3.5 h-3.5"></i><span>${a.app_name||a.name||'App'}</span></span>
    <i data-lucide="chevron-down" class="w-3 h-3 chev"></i>
  </summary>
  <ul class="mt-3 space-y-2 px-3 pb-3">
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>Instant Credit Score Boost</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>Connect Bank</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
    <li class="flex items-center justify-between text-xs text-zinc-300"><span>Add Utilities</span><input type="checkbox" class="w-3 h-3 rounded border-white/10 bg-zinc-800 text-lime-600"></li>
  </ul>
</details>`).join('\n');
}
async function fetchPlansAndSidebar(req, guideId){
  const answers=getWizardAnswers(req);
  const url = `${req.protocol}://${req.get('host')}/api/gpt-plan`;
  const payload={ profile:{ guideId, email:req.cookies?.ss_email||null, answers } };
  const resp=await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
  if(!resp.ok) throw new Error(`/api/gpt-plan ${resp.status}`);

  const tryParse = v => typeof v==='string' ? (()=>{ try{return JSON.parse(v);}catch{return null;} })() : null;
  let data=await resp.json(), plans=[];
  if (Array.isArray(data?.plans) && data.plans.length) plans=data.plans;
  else if (data?.plan) plans=[data.plan];
  else {
    const nest = tryParse(data?.result) || tryParse(data?.output) || tryParse(data?.plan_json) || tryParse(data);
    if (Array.isArray(nest?.plans)) plans=nest.plans;
    else if (nest?.plan) plans=[nest.plan];
  }
  if (!plans.length) {
    plans=[{id:'A',summary:'Fallback demo: utilities + 1 installment.', total_monthly_cost_usd:29,
      apps:[
        {app_name:'Experian Boost', app_description:'Report utilities', monthly_fee_usd:0,  reports_to:'EX',     app_url:'https://www.experian.com/boost'},
        {app_name:'Kikoff',         app_description:'Installment tradeline', monthly_fee_usd:5, reports_to:'EX/EQ/TU', app_url:'https://www.kikoff.com/'}
      ],
      sequence:[{week:1,steps:['Sign up Boost','Connect bank']},{week:2,steps:['Open Kikoff','Enable autopay']}],
      kpis:['+15–30 pts in 30–60 days'], risk_flags:['Missed payments undo progress']
    }];
  }
  const sidebar_html = buildSidebarHtml(deriveSidebarApps(plans));
  return { plans, sidebar_html };
}

// ===== routes =====
app.get('/guide/:id', async (req,res)=>{
  try {
    const token_tail=(req.query.t||'anon').toString().slice(-6);
    const {plans, sidebar_html}=await fetchPlansAndSidebar(req, req.params.id);
    res.render('guide-v3', { stack_title:'StackScore – Build & Compose', token_tail, plans, sidebar_html });
  } catch(err){
    console.error('❌ /guide/:id error:', err);
    const token_tail=(req.query.t||'anon').toString().slice(-6);
    res.status(200).render('guide-v3', { stack_title:'StackScore – Build & Compose', token_tail, plans:[], sidebar_html:'' });
  }
});

// Optional: register the GPT-plan API (use your real handler if you have one)
try {
  const { default: gptPlan } = await import('./api/gpt-plan.js');
  app.post('/api/gpt-plan', gptPlan);
} catch {
  // minimal stub so UI doesn't 404 while you wire the real one
  app.post('/api/gpt-plan', (req,res)=> res.json({ plans: [] }));
}

// magic links AFTER guide
app.use(magicLinks);

app.get('/healthz', (_req,res)=>res.status(200).json({ok:true}));
app.get('*', (req,res)=>res.sendFile(path.join(distDir,'index.html')));

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, ()=> {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Views (server): ${serverViews}`);
  console.log(`Views (public): ${publicViews}`);
});
