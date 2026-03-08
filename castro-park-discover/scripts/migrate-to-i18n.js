/**
 * migrate-to-i18n.js
 * ==================
 * Traduz description e name dos lugares via DeepL e salva como JSON string
 * nas colunas TEXT existentes do Supabase. Zero mudança de schema necessária.
 *
 * Formato armazenado: '{"pt":"...","en":"...","es":"..."}'
 * O hook usePlaces.ts detecta e resolve automaticamente.
 *
 * Uso:
 *   node scripts/migrate-to-i18n.js
 *   node scripts/migrate-to-i18n.js --dry-run
 *   node scripts/migrate-to-i18n.js --limit=10
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = parseInt(
  process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || "500"
);
const BATCH_SIZE = 5; // traduções em paralelo para não sobrecarregar DeepL
const BATCH_DELAY_MS = 3000; // pausa entre batches para evitar rate limit (3s)
const RETRY_DELAYS = [5000, 15000, 30000]; // backoff em ms para 429

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  process.exit(1);
}
if (!DEEPL_API_KEY) {
  console.error("❌ DEEPL_API_KEY é obrigatório");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// DeepL Free API endpoint
const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function translate(texts, targetLang, attempt = 0) {
  if (!texts.length) return [];
  const res = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang,
      source_lang: "PT",
    }),
  });
  if (res.status === 429) {
    if (attempt < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[attempt];
      console.warn(`  ⏳ DeepL 429 (rate limit) — aguardando ${delay / 1000}s antes de tentar novamente...`);
      await sleep(delay);
      return translate(texts, targetLang, attempt + 1);
    }
    const body = await res.text();
    throw new Error(`DeepL 429 (esgotou retentativas): ${body}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.translations.map((t) => t.text);
}

function extractPt(field) {
  if (!field) return "";
  if (typeof field === "string") {
    if (field.startsWith("{")) {
      try {
        const parsed = JSON.parse(field);
        return parsed.pt || parsed.en || "";
      } catch {}
    }
    return field;
  }
  return field.pt || field.en || "";
}

async function processBatch(places) {
  const descs = places.map((p) => extractPt(p.description));
  const names = places.map((p) => extractPt(p.name));

  // Traduz EN e ES em paralelo para description e name
  const [descsEn, descsEs, namesEn, namesEs] = await Promise.all([
    translate(descs, "EN"),
    translate(descs, "ES"),
    translate(names, "EN"),
    translate(names, "ES"),
  ]);

  for (let i = 0; i < places.length; i++) {
    const ptDesc = descs[i];
    const ptName = names[i];

    const descJson = JSON.stringify({ pt: ptDesc, en: descsEn[i], es: descsEs[i] });
    const nameJson = JSON.stringify({ pt: ptName, en: namesEn[i], es: namesEs[i] });

    if (!DRY_RUN) {
      const { error } = await supabase
        .from("places")
        .update({ description: descJson, name: nameJson })
        .eq("id", places[i].id);

      if (error) {
        console.error(`  ❌ ${ptName}: ${error.message}`);
      } else {
        console.log(`  ✅ ${ptName}`);
      }
    } else {
      console.log(`  🔍 ${ptName} (dry-run)`);
      console.log(`     EN: ${descsEn[i].slice(0, 80)}...`);
    }
  }

  return descs.reduce((sum, d, idx) => sum + d.length + (names[idx]?.length || 0), 0);
}

async function main() {
  console.log(`\n🌍 Migração i18n Supabase (${DRY_RUN ? "DRY RUN" : "PRODUÇÃO"})`);
  console.log(`   Limite: ${LIMIT} lugares | Batch: ${BATCH_SIZE}\n`);

  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, description")
    .eq("is_active", true)
    .limit(LIMIT);

  if (error) { console.error("❌ Supabase:", error); process.exit(1); }

  // Filtra apenas registros que ainda não foram traduzidos
  const pending = places.filter((p) => {
    const desc = p.description;
    if (!desc) return false;
    if (typeof desc === "string" && desc.startsWith("{")) {
      try { const parsed = JSON.parse(desc); return !parsed.en; } catch {}
    }
    return true; // string PT pura — precisa traduzir
  });

  console.log(`📦 ${places.length} total | ${pending.length} pendentes de tradução\n`);

  if (pending.length === 0) {
    console.log("✅ Todos os lugares já foram traduzidos!");
    return;
  }

  let totalChars = 0;
  const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = pending.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches}`);
    totalChars += await processBatch(batch);
    // Pausa entre batches para não sobrecarregar o rate limit da DeepL
    if (batchNum < totalBatches) await sleep(BATCH_DELAY_MS);
  }

  console.log(`\n📊 Concluído`);
  console.log(`   Lugares: ${pending.length}`);
  console.log(`   Chars estimados: ~${totalChars.toLocaleString()}`);
  console.log(`   Custo DeepL: ~$0 (dentro do free tier 500K chars/mês)\n`);
}

main().catch(console.error);
