// Live E2E for the AI Edge tools. Confirms the 3 tool pages + /ai-edge serve 200 and the
// clickable-card hrefs are present. The tool logic (prompt builders + normalizers) is
// covered by Vitest, and the live Groq path is verified manually (Task 14, step 4) — driving
// a server action over raw HTTP isn't practical, so this script checks routing + render only.
//   node scripts/verify-ai-edge-e2e.mjs   (dev server must be up)
const BASE = "http://localhost:3000";

function step(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} | ${label}${detail ? " | " + detail : ""}`);
  if (!ok) process.exitCode = 1;
}
async function get(path) {
  const res = await fetch(BASE + path, { redirect: "manual" });
  return { status: res.status, body: res.status === 200 ? await res.text() : "" };
}

const pages = [
  "/ai-edge",
  "/ai-edge/predictive-insights",
  "/ai-edge/route-optimizer",
  "/ai-edge/proactive-resolution",
];
for (const p of pages) {
  const r = await get(p);
  step(`GET ${p} → 200`, r.status === 200, `status=${r.status}`);
}

const edge = await get("/ai-edge");
step("/ai-edge links to all three tools",
  ["/ai-edge/predictive-insights", "/ai-edge/route-optimizer", "/ai-edge/proactive-resolution"].every((h) => edge.body.includes(h)));

const predictive = await get("/ai-edge/predictive-insights");
step("predictive page renders the lane console", predictive.body.includes("Run analysis") && predictive.body.includes("Origin"));

console.log(process.exitCode ? "\nRESULT: FAIL" : "\nRESULT: ALL GREEN");
