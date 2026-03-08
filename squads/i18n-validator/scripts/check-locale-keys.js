#!/usr/bin/env node
/**
 * check-locale-keys.js
 * ====================
 * Compara as chaves entre os 3 arquivos de locale (pt/en/es) e reporta:
 * - Chaves ausentes em EN ou ES
 * - Valores vazios em qualquer locale
 * - Chaves onde EN ou ES têm o mesmo valor do PT (suspeita de não-tradução)
 *
 * Uso: node squads/i18n-validator/scripts/check-locale-keys.js
 * (executar a partir de castro-park-discover/)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const LOCALES_DIR = resolve("public/locales");

function loadLocale(lang) {
  const path = resolve(LOCALES_DIR, lang, "translation.json");
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    console.error(`❌ Erro ao ler ${path}: ${e.message}`);
    process.exit(1);
  }
}

// Retorna todas as chaves em notação dot ("nav.guide", "home.title", etc.)
function flattenKeys(obj, prefix = "") {
  const keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = v;
    }
  }
  return keys;
}

const pt = flattenKeys(loadLocale("pt"));
const en = flattenKeys(loadLocale("en"));
const es = flattenKeys(loadLocale("es"));

const ptKeys = Object.keys(pt);
const enKeys = new Set(Object.keys(en));
const esKeys = new Set(Object.keys(es));

let issues = 0;
let warnings = 0;

console.log("\n🌍 check-locale-keys — Validação de completude dos locales\n");
console.log(`   PT: ${ptKeys.length} chaves`);
console.log(`   EN: ${Object.keys(en).length} chaves`);
console.log(`   ES: ${Object.keys(es).length} chaves\n`);

// 1. Chaves em PT ausentes em EN
const missingEn = ptKeys.filter((k) => !enKeys.has(k));
if (missingEn.length) {
  console.log(`❌ FAIL — ${missingEn.length} chave(s) ausente(s) em EN:`);
  missingEn.forEach((k) => console.log(`   • ${k}`));
  issues += missingEn.length;
} else {
  console.log("✅ EN — todas as chaves PT presentes");
}

// 2. Chaves em PT ausentes em ES
const missingEs = ptKeys.filter((k) => !esKeys.has(k));
if (missingEs.length) {
  console.log(`\n❌ FAIL — ${missingEs.length} chave(s) ausente(s) em ES:`);
  missingEs.forEach((k) => console.log(`   • ${k}`));
  issues += missingEs.length;
} else {
  console.log("✅ ES — todas as chaves PT presentes");
}

// 3. Chaves extras em EN (não existem em PT)
const extraEn = [...enKeys].filter((k) => !ptKeys.includes(k));
if (extraEn.length) {
  console.log(`\n⚠️  WARNING — ${extraEn.length} chave(s) em EN que não existem em PT:`);
  extraEn.forEach((k) => console.log(`   • ${k}`));
  warnings += extraEn.length;
}

// 4. Chaves extras em ES (não existem em PT)
const extraEs = [...esKeys].filter((k) => !ptKeys.includes(k));
if (extraEs.length) {
  console.log(`\n⚠️  WARNING — ${extraEs.length} chave(s) em ES que não existem em PT:`);
  extraEs.forEach((k) => console.log(`   • ${k}`));
  warnings += extraEs.length;
}

// 5. Valores vazios em qualquer locale
const emptyPt = ptKeys.filter((k) => pt[k] === "");
const emptyEn = ptKeys.filter((k) => en[k] === "");
const emptyEs = ptKeys.filter((k) => es[k] === "");

if (emptyPt.length || emptyEn.length || emptyEs.length) {
  console.log("\n⚠️  WARNING — Valores vazios encontrados:");
  emptyPt.forEach((k) => console.log(`   • PT.${k} = ""`));
  emptyEn.forEach((k) => console.log(`   • EN.${k} = ""`));
  emptyEs.forEach((k) => console.log(`   • ES.${k} = ""`));
  warnings += emptyPt.length + emptyEn.length + emptyEs.length;
}

// 6. Valores idênticos PT=EN (suspeita de não-tradução)
const sameEnAsPt = ptKeys.filter(
  (k) => en[k] && en[k] === pt[k] && pt[k].length > 10 && /[áéíóúàãõâêôçÁÉÍÓÚÀÃÕÂÊÔÇ]/.test(pt[k])
);
if (sameEnAsPt.length) {
  console.log(`\n⚠️  WARNING — ${sameEnAsPt.length} chave(s) com EN igual ao PT (com acento — suspeita de não-tradução):`);
  sameEnAsPt.slice(0, 10).forEach((k) => console.log(`   • ${k}: "${pt[k].slice(0, 60)}"`));
  if (sameEnAsPt.length > 10) console.log(`   ... e mais ${sameEnAsPt.length - 10}`);
  warnings += sameEnAsPt.length;
}

// 7. Verificar interpolações {{var}}
const interpolationRegex = /\{\{(\w+)\}\}/g;
let interpolationIssues = 0;
for (const key of ptKeys) {
  const ptVal = String(pt[key] || "");
  const ptVars = [...ptVal.matchAll(interpolationRegex)].map((m) => m[1]);
  if (!ptVars.length) continue;

  const enVal = String(en[key] || "");
  const esVal = String(es[key] || "");
  const enVars = [...enVal.matchAll(interpolationRegex)].map((m) => m[1]);
  const esVars = [...esVal.matchAll(interpolationRegex)].map((m) => m[1]);

  const missingInEn = ptVars.filter((v) => !enVars.includes(v));
  const missingInEs = ptVars.filter((v) => !esVars.includes(v));

  if (missingInEn.length || missingInEs.length) {
    console.log(`\n❌ FAIL — Interpolação faltando em "${key}":`);
    if (missingInEn.length) console.log(`   EN: falta {{${missingInEn.join("}}, {{")}}}`);
    if (missingInEs.length) console.log(`   ES: falta {{${missingInEs.join("}}, {{")}}}`);
    interpolationIssues++;
    issues++;
  }
}
if (!interpolationIssues) console.log("\n✅ Interpolações {{var}} — todas consistentes");

// Resumo final
console.log("\n" + "─".repeat(50));
console.log("📊 RESUMO");
console.log(`   ❌ Issues (BLOCKER): ${issues}`);
console.log(`   ⚠️  Warnings:        ${warnings}`);
console.log(`   Status: ${issues === 0 ? "✅ PASS" : "❌ FAIL"}\n`);

process.exit(issues > 0 ? 1 : 0);
