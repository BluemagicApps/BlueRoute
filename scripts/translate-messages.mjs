// scripts/translate-messages.mjs
// Generates messages/<locale>.json from messages/en.json via Groq.
// Usage: node --env-file=.env.local scripts/translate-messages.mjs          (all locales)
//        node --env-file=.env.local scripts/translate-messages.mjs fr ar     (subset)
//        node --env-file=.env.local scripts/translate-messages.mjs --normalize (no Groq;
//          re-merge every existing messages/<code>.json onto the en.json template,
//          filling missing keys with English and dropping stray keys)
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

const en = JSON.parse(readFileSync(resolve(root, "messages/en.json"), "utf8"));

// Recursively walk `template` (en.json or a namespace fragment of it) and
// produce an object with the EXACT same key structure. For each leaf string
// key, use the corresponding value from `translated` if it is a string,
// otherwise fall back to the English value from `template`. Keys that exist
// only in `translated` (stray/misplaced keys) are dropped.
export function mergeOntoTemplate(template, translated) {
  if (typeof template === "string") {
    return typeof translated === "string" ? translated : template;
  }
  const out = {};
  for (const key of Object.keys(template)) {
    out[key] = mergeOntoTemplate(template[key], translated?.[key]);
  }
  return out;
}

const args = process.argv.slice(2);

if (args.includes("--normalize")) {
  for (const code of Object.keys(TARGETS)) {
    const path = resolve(root, `messages/${code}.json`);
    let existing = {};
    try {
      existing = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      // Missing/unparseable catalog: fall back to all-English.
    }
    const merged = mergeOntoTemplate(en, existing);
    writeFileSync(path, JSON.stringify(merged, null, 2) + "\n", "utf8");
    console.log(`✓ normalized messages/${code}.json`);
  }
  process.exit(0);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const picked = args.filter((c) => c in TARGETS);
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
  const merged = mergeOntoTemplate(en, out);
  writeFileSync(resolve(root, `messages/${code}.json`), JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`✓ messages/${code}.json`);
}
