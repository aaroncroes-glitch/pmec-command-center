#!/usr/bin/env node
// Puts the client portal demonstration back to its opening state: no change orders, the
// original figures (48% · AWG 820,000 · AWG 312,000 invoiced), the programme with M04 in
// progress, and the one site update. Safe to run any number of times, and it only touches
// demonstration clients — the database refuses anything else.
//
//   node scripts/reset-client-demo.mjs
const URL = process.env.PMEC_PORTAL_SUPABASE_URL ?? "https://cvzgyaccdshdizsuxewh.supabase.co";
const KEY = process.env.PMEC_PORTAL_SUPABASE_KEY ?? "sb_publishable_v9A5ihNTdIwXMhQ9FeOtIw_gsL9tJz3";
const project = process.argv[2] ?? "jo-hotel-renovation";

const res = await fetch(`${URL}/rest/v1/rpc/demo_reset_project`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ p_project: project }),
});
const body = await res.text();
if (!res.ok) {
  console.error(`Reset failed (${res.status}): ${body}`);
  process.exit(1);
}
console.log(`Client portal demo reset: ${project}`);
console.log("  48% · AWG 820,000 contract · AWG 312,000 invoiced · M04 in progress · no change orders");
