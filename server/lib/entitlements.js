// server/lib/entitlements.js
// TODO: swap console stubs for your Xata upsert
export async function upsertEntitlement({ email, stackKey }) {
  // write to DB: entitlements(email, stackKey, active=true, created_at)
  console.log(`🔐 upsert entitlement → ${email} • ${stackKey}`);
  return { ok: true };
}
