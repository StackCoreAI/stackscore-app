export default async function handler(req, res) {
    const s = process.env.STRIPE_SECRET_KEY || "";
    const w = process.env.STRIPE_WEBHOOK_SECRET || "";
    res.status(200).json({
      ok: !!(s && w),
      stripe_key: s ? `${s.slice(0,6)}...${s.slice(-4)}` : "missing",
      webhook_secret: w ? `${w.slice(0,6)}...${w.slice(-4)}` : "missing",
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
    });
  }
  