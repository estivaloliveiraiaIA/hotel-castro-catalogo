/**
 * fix-distances-driving.js
 *
 * Calcula distância REAL de carro (rota) de cada lugar até o hotel
 * usando OpenRouteService Matrix API (gratuito).
 *
 * Uso:
 *   ORS_API_KEY=<sua_key> node scripts/fix-distances-driving.js
 *
 * Flags:
 *   --dry-run   Calcula mas não salva nada
 *   --force     Força update no Supabase mesmo sem mudança no JSON
 *
 * Env vars necessárias para Supabase:
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLACES_JSON = path.join(ROOT, "public", "data", "places.json");

// ─── Configuração ────────────────────────────────────────────────────────────

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_MATRIX_URL = "https://api.openrouteservice.org/v2/matrix/driving-car";

// Coordenadas precisas do Castro's Park Hotel
// ⚠️  ORS usa formato [longitude, latitude] — diferente do padrão lat/lng!
const HOTEL_COORD = [-49.2541, -16.6804]; // [lng, lat]

// ORS free tier: máximo de 3500 elementos por request (origins × destinations)
// Com 1 origem: aceita até 3500 destinos por chamada.
// Usamos 500 por lote para folga de segurança.
const BATCH_SIZE = 500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes("--dry-run");
const forceSupabase = process.argv.includes("--force");

function metersToKm(m) {
  if (!Number.isFinite(m) || m < 0) return null;
  return +(m / 1000).toFixed(2);
}

// ─── ORS Matrix API ──────────────────────────────────────────────────────────

/**
 * Chama ORS Matrix API para um lote de destinos.
 * Retorna array de distâncias em metros (uma por destino), na mesma ordem.
 */
async function fetchDrivingDistances(destinations) {
  if (!ORS_API_KEY) {
    throw new Error("ORS_API_KEY não definida. Use: ORS_API_KEY=<key> node scripts/fix-distances-driving.js");
  }

  // locations[0] = hotel (fonte), locations[1..N] = destinos
  const locations = [HOTEL_COORD, ...destinations];
  const sources = [0];
  const dests = destinations.map((_, i) => i + 1);

  const res = await fetch(ORS_MATRIX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify({
      locations,
      sources,
      destinations: dests,
      metrics: ["distance"],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ORS API error ${res.status}: ${txt}`);
  }

  const json = await res.json();

  // distances[0] = linha do hotel para todos os destinos
  const row = json?.distances?.[0];
  if (!Array.isArray(row)) {
    throw new Error(`Resposta inesperada da ORS: ${JSON.stringify(json)}`);
  }

  return row; // metros por destino
}

// ─── Supabase ────────────────────────────────────────────────────────────────

async function updateSupabase(updates) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("⚠️  Supabase não configurado — pulando atualização remota.");
    return 0;
  }

  let ok = 0;
  let fail = 0;
  const CONC = 15;

  for (let i = 0; i < updates.length; i += CONC) {
    const batch = updates.slice(i, i + CONC);
    await Promise.all(
      batch.map(async ({ id, distanceKm }) => {
        const r = await fetch(
          `${url}/rest/v1/places?id=eq.${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: key,
              Authorization: `Bearer ${key}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ distance_km: distanceKm }),
          }
        );
        r.ok ? ok++ : fail++;
      })
    );
    process.stdout.write(`  Supabase: ${ok}/${updates.length}\r`);
  }

  process.stdout.write("\n");
  if (fail > 0) console.warn(`  ⚠️  ${fail} falhas no Supabase`);
  return ok;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚗 Castro's Park Hotel — Distâncias reais de carro (ORS)");
  console.log(`   Hotel: lng=${HOTEL_COORD[0]} lat=${HOTEL_COORD[1]}`);
  if (isDryRun) console.log("   [DRY RUN — nada será salvo]");
  console.log("");

  const raw = await fs.readFile(PLACES_JSON, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  console.log(`📦 ${places.length} lugares carregados`);

  // Separa lugares com coordenadas dos sem
  const withCoords = places.filter(
    (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
  );
  const noCoords = places.length - withCoords.length;

  console.log(`   Com coordenadas: ${withCoords.length} | Sem: ${noCoords}`);
  console.log("");

  // Processa em lotes
  const supabaseUpdates = [];
  let processed = 0;
  let changed = 0;
  let errors = 0;

  for (let i = 0; i < withCoords.length; i += BATCH_SIZE) {
    const batch = withCoords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(withCoords.length / BATCH_SIZE);

    console.log(`📡 Lote ${batchNum}/${totalBatches} (${batch.length} lugares)...`);

    let meters;
    try {
      // ORS espera [lng, lat]
      const coords = batch.map((p) => [p.longitude, p.latitude]);
      meters = await fetchDrivingDistances(coords);
    } catch (err) {
      console.error(`  ❌ Erro no lote ${batchNum}: ${err.message}`);
      errors++;
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const place = batch[j];
      const newDist = metersToKm(meters[j]);

      if (newDist === null) continue;

      const oldDist = place.distanceKm;
      const diff = Math.abs((oldDist ?? 0) - newDist);

      if (diff > 0.01) {
        changed++;
        if (diff > 1) {
          console.log(
            `  ~ ${place.name.slice(0, 44).padEnd(44)} ${String(oldDist ?? "—").padStart(6)} → ${String(newDist).padStart(6)} km`
          );
        }
      }

      place.distanceKm = newDist;

      if (oldDist !== newDist || forceSupabase) {
        supabaseUpdates.push({ id: place.id, distanceKm: newDist });
      }

      processed++;
    }

    // Aguarda 1s entre lotes para respeitar rate limit (40/min)
    if (i + BATCH_SIZE < withCoords.length) {
      await new Promise((r) => setTimeout(r, 1100));
    }
  }

  console.log(`\n📏 Processados: ${processed} | Alterados: ${changed} | Erros: ${errors}`);

  if (isDryRun) {
    console.log("\n[DRY RUN] Nada foi salvo.");
    return;
  }

  // Salva places.json
  doc.updatedAt = new Date().toISOString();
  await fs.writeFile(PLACES_JSON, JSON.stringify(doc, null, 2), "utf8");
  console.log("✅ places.json salvo");

  // Atualiza Supabase
  if (supabaseUpdates.length > 0) {
    console.log(`\n🔄 Atualizando Supabase (${supabaseUpdates.length} lugares)...`);
    const updated = await updateSupabase(supabaseUpdates);
    if (updated > 0) console.log(`✅ Supabase: ${updated} lugares atualizados`);
  } else {
    console.log("✅ Supabase: sem alterações necessárias");
  }

  console.log("\nDone. 🚗");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
