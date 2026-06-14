// scripts/verify-i18n-e2e.mjs
// Live E2E for the i18n feature. Requires a running server on http://localhost:3000
// (npm run dev, or a prod `npm run build && npm start`).
//   node scripts/verify-i18n-e2e.mjs
const BASE = process.env.BASE_URL || "http://localhost:3000";
let failed = false;
const ok = (name, cond, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
  if (!cond) failed = true;
};

// 1. First visit with a CN geo header → response sets NEXT_LOCALE=zh
const r1 = await fetch(BASE, { headers: { "x-vercel-ip-country": "CN" }, redirect: "manual" });
const setCookie = r1.headers.get("set-cookie") || "";
ok("CN geo header → NEXT_LOCALE=zh cookie", /NEXT_LOCALE=zh/.test(setCookie), `set-cookie=${setCookie.slice(0, 60)}`);

// 2. Existing fr cookie → home renders <html lang="fr">
const r2 = await fetch(BASE, { headers: { cookie: "NEXT_LOCALE=fr" } });
const html2 = await r2.text();
ok('fr cookie → <html lang="fr">', /<html[^>]*lang="fr"/.test(html2));

// 3. ar cookie → dir="rtl"
const r3 = await fetch(BASE, { headers: { cookie: "NEXT_LOCALE=ar" } });
const html3 = await r3.text();
ok('ar cookie → <html ... dir="rtl">', /<html[^>]*dir="rtl"/.test(html3));

// 4. No MISSING_MESSAGE leaked into rendered French/Arabic HTML
ok("no MISSING_MESSAGE in fr render", !/MISSING_MESSAGE|IntlError/.test(html2));
ok("no MISSING_MESSAGE in ar render", !/MISSING_MESSAGE|IntlError/.test(html3));

// 5. translate endpoint returns a translation string (best-effort: may echo source if Groq is unavailable)
const r5 = await fetch(`${BASE}/api/ai/translate`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: "Your shipment is delayed", targetLocale: "es" }),
});
const j5 = await r5.json().catch(() => ({}));
ok("translate endpoint returns a string", typeof j5.translation === "string" && j5.translation.length > 0, `status=${r5.status}`);

// 6. translate endpoint validates input (invalid locale → 400)
const r6 = await fetch(`${BASE}/api/ai/translate`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: "hi", targetLocale: "xx" }),
});
ok("translate rejects invalid locale (400)", r6.status === 400, `status=${r6.status}`);

process.exit(failed ? 1 : 0);
