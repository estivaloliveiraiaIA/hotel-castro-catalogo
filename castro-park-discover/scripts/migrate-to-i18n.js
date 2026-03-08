/**
 * migrate-to-i18n.js
 * ==================
 * Migra colunas TEXT do Supabase para JSONB multilíngue {pt, en, es}.
 *
 * Pré-requisitos:
 *   - VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente
 *   - DEEPL_API_KEY (https://www.deepl.com/pt-BR/pro-api — free tier: 500K chars/mês)
 *
 * Uso:
 *   DEEPL_API_KEY=xxx node scripts/migrate-to-i18n.js
 *   DEEPL_API_KEY=xxx node scripts/migrate-to-i18n.js --dry-run
 *   DEEPL_API_KEY=xxx node scripts/migrate-to-i18n.js --table=places --limit=50
 *
 * O que faz:
 *   1. Para cada lugar ativo, pega description (TEXT)
 *   2. Traduz para EN e ES via DeepL API
 *   3. Atualiza description para JSONB {pt, en, es}
 *
 * NOTA: Requer migration SQL antes de rodar:
 *   ALTER TABLE places ALTER COLUMN description TYPE jsonb USING jsonb_build_object('pt', description);
 *   ALTER TABLE places ALTER COLUMN name TYPE jsonb USING jsonb_build_object('pt', name);
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || "500");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  process.exit(1);
}

if (!DEEPL_API_KEY) {
  console.error("❌ DEEPL_API_KEY é obrigatório");
  console.error("   Obtenha em: https://www.deepl.com/pt-BR/pro-api (free tier: 500K chars/mês)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function translate(text, targetLang) {
  if (!text || text.trim().length === 0) return text;
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang,
      source_lang: "PT",
    }),
  });
  if (!res.ok) throw new Error(`DeepL error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.translations[0].text;
}

async function main() {
  console.log(`\n🌍 Migração i18n — ${DRY_RUN ? "DRY RUN" : "REAL"}`);
  console.log(`   Limite: ${LIMIT} registros\n`);

  const { data: places, error } = await supabase
    .from("places")
    .select("id, name, description")
    .eq("is_active", true)
    .limit(LIMIT);

  if (error) { console.error("❌ Erro ao buscar places:", error); process.exit(1); }
  console.log(`📦 ${places.length} lugares encontrados\n`);

  let totalChars = 0;
  let processed = 0;
  let errors = 0;

  for (const place of places) {
    const desc = typeof place.description === "string"
      ? place.description
      : place.description?.pt;

    const name = typeof place.name === "string"
      ? place.name
      : place.name?.pt;

    if (!desc) { console.log(`⏭  ${name} — sem description`); continue; }

    try {
      if (!DRY_RUN) {
        const [descEn, descEs, nameEn, nameEs] = await Promise.all([
          translate(desc, "EN"),
          translate(desc, "ES"),
          translate(name, "EN"),
          translate(name, "ES"),
        ]);

        await supabase
          .from("places")
          .update({
            description: { pt: desc, en: descEn, es: descEs },
            name: { pt: name, en: nameEn, es: nameEs },
          })
          .eq("id", place.id);

        totalChars += (desc.length + name.length) * 2;
        console.log(`✅ ${name} → traduzido`);
      } else {
        totalChars += (desc.length + name.length) * 2;
        console.log(`🔍 ${name} — ${desc.length} chars (dry run)`);
      }
      processed++;
    } catch (err) {
      console.error(`❌ ${name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Processados: ${processed}`);
  console.log(`   Erros: ${errors}`);
  console.log(`   Chars traduzidos: ~${totalChars.toLocaleString()}`);
  console.log(`   Custo DeepL: ~$0 (free tier: 500K chars/mês)\n`);
}

main().catch(console.error);
