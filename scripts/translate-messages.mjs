// scripts/translate-messages.mjs
// Generates messages/<locale>.json from messages/en.json via Groq.
// Usage: node --env-file=.env.local scripts/translate-messages.mjs          (all locales)
//        node --env-file=.env.local scripts/translate-messages.mjs fr ar     (subset)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Groq from "groq-sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const TARGETS = {
  zh: "Mandarin Chinese", hi: "Hindi", es: "Spanish", fr: "French",
  ar: "Arabic", bn: "Bengali", pt: "Portuguese", ru: "Russian", ur: "Urdu",
};
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const en = JSON.parse(readFileSync(resolve(root, "messages/en.json"), "utf8"));
const picked = process.argv.slice(2).filter((c) => c in TARGETS);
const locales = picked.length ? picked : Object.keys(TARGETS);

const prompt = (langName, namespace, json) =>
  `Translate the VALUES of this JSON i18n catalog fragment (namespace "${namespace}") from English to ${langName}. ` +
  `Rules: keep every KEY exactly as-is; preserve ICU placeholders like {name}, {count}, ` +
  `and HTML/markup; do NOT translate the brand name "Blue Route"; return ONLY valid JSON ` +
  `with the identical structure (same keys, only string values translated).\n\n${JSON.stringify(json, null, 2)}`;

// Translate each top-level namespace separately to avoid output truncation on
// large catalogs / non-Latin scripts that expand token count significantly.
for (const code of locales) {
  const out = {};
  for (const namespace of Object.keys(en)) {
    const res = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt(TARGETS[code], namespace, en[namespace]) }],
    });
    out[namespace] = JSON.parse(res.choices[0].message.content);
  }
  writeFileSync(resolve(root, `messages/${code}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✓ messages/${code}.json`);
}
