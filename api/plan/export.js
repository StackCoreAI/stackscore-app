// api/plan/export.js
export const config = { runtime: "nodejs" };

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ------------------------------ helpers ------------------------------ */
function readSearchParam(req, key) {
  try { return new URL(req.url, `https://${req.headers.host || "x"}`).searchParams.get(key); }
  catch { return null; }
}
function safeJson(body) {
  try {
    if (!body) return {};
    if (typeof body === "object" && !(body instanceof Buffer)) return body;
    const s = body instanceof Buffer ? body.toString("utf8") : String(body);
    return JSON.parse(s || "{}");
  } catch { return {}; }
}
// WinAnsi-safe encoder (replaces smart punctuation, bullets, NBSP/NB hyphen, etc.)
function enc(v) {
  if (v == null) return "—";
  let s = typeof v === "string" ? v
        : (typeof v === "number" || typeof v === "boolean") ? String(v)
        : (()=>{ try { return JSON.stringify(v); } catch { return String(v); } })();
  return s
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u2043\u00B7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\x7E]/g, "");
}
// Normalize apps (arrays, objects, {plans}, {plan}, nested .plan)
function normalizeApps(plans, planKey) {
  try {
    if (!plans) return [];
    const base = (plans && plans.plans && typeof plans.plans === "object") ? plans.plans : plans;

    if (Array.isArray(base)) {
      const looksLikeApps = base.some(a => a && typeof a === "object" && ("app_name" in a || "name" in a));
      if (looksLikeApps) return base;
      for (const node of base) {
        if (!node || typeof node !== "object") continue;
        if (Array.isArray(node.apps))  return node.apps;
        if (Array.isArray(node.stack)) return node.stack;
        if (Array.isArray(node.items)) return node.items;
        if (node.plan) {
          if (Array.isArray(node.plan.apps))  return node.plan.apps;
          if (Array.isArray(node.plan.stack)) return node.plan.stack;
          if (Array.isArray(node.plan.items)) return node.plan.items;
        }
      }
      return [];
    }

    if (base && typeof base === "object") {
      if (Array.isArray(base.apps))  return base.apps;
      if (Array.isArray(base.stack)) return base.stack;
      if (Array.isArray(base.items)) return base.items;

      const node = base[planKey];
      if (node && typeof node === "object") {
        if (Array.isArray(node.apps))  return node.apps;
        if (Array.isArray(node.stack)) return node.stack;
        if (Array.isArray(node.items)) return node.items;
        if (node.plan) {
          if (Array.isArray(node.plan.apps))  return node.plan.apps;
          if (Array.isArray(node.plan.stack)) return node.plan.stack;
          if (Array.isArray(node.plan.items)) return node.plan.items;
        }
      }
      for (const v of Object.values(base)) {
        if (!v || typeof v !== "object") continue;
        if (Array.isArray(v.apps))  return v.apps;
        if (Array.isArray(v.stack)) return v.stack;
        if (Array.isArray(v.items)) return v.items;
        if (v.plan) {
          if (Array.isArray(v.plan.apps))  return v.plan.apps;
          if (Array.isArray(v.plan.stack)) return v.plan.stack;
          if (Array.isArray(v.plan.items)) return v.plan.items;
        }
      }
    }
  } catch {}
  return [];
}
// Flexible mapper → consistent fields for rendering
function mapApp(a) {
  if (!a || typeof a !== "object") return { title: "App" };
  return {
    title: a.app_name || a.name || a.title || a.app || "App",
    category: a.category || a.type || a.tier || a.scope || "",
    reason: a.reason || a.why || a.description || a.summary || "",
    action: a.action || a.next || a.step || a.activation || "",
    url: a.url || a.link || a.website || a.homepage || ""
  };
}

/* -------------------------------- UI kit --------------------------------- */
const BRAND = { bg: rgb(0.06,0.06,0.06), text: rgb(0.07,0.07,0.07), lime: rgb(0.65,1.00,0.40), gray: rgb(0.38,0.38,0.38), border: rgb(0.88,0.88,0.88) };
function drawSectionTitle(p,b,x,y,t){ p.drawRectangle({x,y:y-10,width:4,height:20,color:BRAND.lime}); p.drawText(enc(t),{x:x+12,y,size:14,font:b,color:BRAND.text}); }
function drawKeyVal(p,f,xk,xv,y,k,v,right=540){ const size=11; p.drawText(enc(`${k}:`),{x:xk,y,size,font:f,color:BRAND.gray});
  let txt=enc(v); const max=right-xv; while(f.widthOfTextAtSize(txt,size)>max && txt.length>3) txt=txt.slice(0,-1);
  p.drawText(txt,{x:xv,y,size,font:f,color:BRAND.text}); return y-14; }
function drawBullets(p,f,x,y,t,maxW){ const size=11; const words=enc(t).split(/\s+/); const lines=[]; let line="-";
  for(const w of words){ const test=(line==="-" )?`- ${w}`:`${line} ${w}`; if(f.widthOfTextAtSize(test,size)>maxW){ lines.push(line); line=`- ${w}`; } else { line=test; } }
  if(line.trim()) lines.push(line); let yy=y; for(const ln of lines){ p.drawText(ln,{x,y:yy,size,font:f,color:BRAND.text}); yy-=14; } return yy; }

/* ------------------------------- handler ---------------------------------- */
export default async function handler(req,res){
  if(req.method!=="POST"){ res.setHeader("Allow","POST"); return res.status(405).json({error:"Method not allowed"}); }

  const data = safeJson(req.body);
  const dbg  = readSearchParam(req,"debug");
  const { ss_access, planKey="growth", answers={}, plans=[] } = data;

  if(dbg==="1"){
    const apps = normalizeApps(plans, planKey);
    return res.status(200).json({ ok:true, received:{ planKey, answersKeys:Object.keys(answers||{}), normalizedCount:Array.isArray(apps)?apps.length:0, sample:Array.isArray(apps)&&apps.length?apps[0]:null } });
  }

  try{
    if(ss_access!=="1") return res.status(403).json({ error:"Not authorized" });

    const rawList = normalizeApps(plans, planKey).filter(a => a && typeof a === "object");
    const appList = rawList.map(mapApp);

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let page = pdf.addPage([612,792]);
    const { width, height } = page.getSize();

    // Header
    page.drawRectangle({x:0,y:height-90,width,height:90,color:BRAND.bg});
    page.drawText("StackScore",{x:36,y:height-56,size:22,font:bold,color:BRAND.lime});
    page.drawText("Optimized Stack Plan",{x:36,y:height-78,size:12,font,color:rgb(1,1,1)});

    // Title + Answers panel
    const titleY = height-120;
    page.drawText("Your Optimized Credit Stack",{x:36,y:titleY,size:18,font:bold,color:BRAND.text});
    page.drawText(enc(`Selected Plan: ${String(planKey).toUpperCase()}`),{x:36,y:titleY-20,size:11,font,color:BRAND.gray});

    const panelTop = titleY-50;
    page.drawRectangle({x:32,y:panelTop-130,width:width-64,height:130,color:rgb(1,1,1),borderColor:BRAND.border,borderWidth:1});
    drawSectionTitle(page,bold,40,panelTop+98,"Your Answers");

    let yL=panelTop+78, yR=panelTop+78;
    const subs = Array.isArray(answers.subs)?answers.subs.map(enc).join(", "):enc(answers.subs);
    yL = drawKeyVal(page,font,60,155,yL,"Housing",enc(answers.housing));
    yL = drawKeyVal(page,font,60,155,yL,"Subscriptions",subs||"—");
    yL = drawKeyVal(page,font,60,155,yL,"Tools",enc(answers.tools));
    yR = drawKeyVal(page,font,320,410,yR,"Employment",enc(answers.employment));
    yR = drawKeyVal(page,font,320,410,yR,"Goal (days)",enc(answers.goal));
    yR = drawKeyVal(page,font,320,410,yR,"Budget / mo",answers.budget!=null?enc(`$${answers.budget}`):"—");

    page.drawText(enc("These recommendations pair proven credit-builder apps with smart tracking to compound wins quickly."),
      {x:36,y:panelTop-20,size:11,font,color:BRAND.gray});

    // Apps
    let y = panelTop-50;
    drawSectionTitle(page,bold,36,y+20,"Recommended Apps");
    y-=6;

    const startX=48, maxW=width-startX-48;

    if(appList.length===0){
      page.drawText(enc("No recommended apps were found for this plan."),{x:startX,y:y+12,size:11,font,color:BRAND.gray});
      y-=24;
    } else {
      for(let i=0;i<Math.min(appList.length,50);i++){
        if(y<100){
          page.drawLine({start:{x:36,y:40},end:{x:width-36,y:40},thickness:0.5,color:BRAND.border});
          page.drawText(`Generated by StackScore • © ${new Date().getFullYear()}`,{x:36,y:26,size:9,font,color:BRAND.gray});
          page = pdf.addPage([612,792]);
          const { height:h2 } = page.getSize();
          page.drawRectangle({x:0,y:h2-90,width,height:90,color:BRAND.bg});
          page.drawText("StackScore",{x:36,y:h2-56,size:22,font:bold,color:BRAND.lime});
          page.drawText("Optimized Stack Plan",{x:36,y:h2-78,size:12,font,color:rgb(1,1,1)});
          y = h2-72;
          drawSectionTitle(page,bold,36,y+20,"Recommended Apps (cont.)");
          y-=6;
        }
        const app = appList[i];
        // card
        page.drawRectangle({x:40,y:y-2,width:width-80,height:60,color:rgb(1,1,1),borderColor:BRAND.border,borderWidth:1});
        page.drawText(`${i+1}. ${enc(app.title)}`,{x:startX,y:y+34,size:12,font:bold,color:BRAND.text});
        let nextY=y+18;
        if(app.category) nextY = drawBullets(page,font,startX,nextY,`Category: ${app.category}`,maxW);
        if(app.reason)   nextY = drawBullets(page,font,startX,nextY,app.reason,maxW);
        if(app.action)   nextY = drawBullets(page,font,startX,nextY,`Action: ${app.action}`,maxW);
        if(app.url)      nextY = drawBullets(page,font,startX,nextY,`Link: ${app.url}`,maxW);
        y-=70;
      }
    }

    // Footer last page
    page.drawLine({start:{x:36,y:40},end:{x:width-36,y:40},thickness:0.5,color:BRAND.border});
    page.drawText(`Generated by StackScore • © ${new Date().getFullYear()}`,{x:36,y:26,size:9,font,color:BRAND.gray});

    const bytes = await pdf.save();
    const filename = `StackScore-Plan-${String(planKey).toUpperCase()}.pdf`;
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${filename}"`);
    return res.status(200).end(Buffer.from(bytes));
  } catch (e) {
    const show = readSearchParam(req,"debug")==="2";
    console.error("export error:",e);
    return res.status(500).json({ error:"export_failed", ...(show?{ detail:e?.message||String(e), stack:e?.stack }:{}) });
  }
}
