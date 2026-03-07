/**
 * fix-distances.js
 *
 * Recalcula distanceKm de TODOS os lugares usando as coordenadas
 * precisas do Castro's Park Hotel e atualiza:
 *   1. public/data/places.json (fallback estático)
 *   2. Supabase (tabela places, coluna distance_km) — se SUPABASE_URL estiver definido
 *
 * Uso:
 *   node scripts/fix-distances.js
 *
 * Env vars necessárias (opcional para Supabase):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLACES_JSON = path.join(ROOT, "public", "data", "places.json");

// ────────────────────────────────────────────────────────
// Coordenadas precisas do Castro's Park Hotel
// Av. República do Líbano, 1520 - St. Oeste, Goiânia - GO
// ────────────────────────────────────────────────────────
const HOTEL_LAT = -16.6804;
const HOTEL_LNG = -49.2541;

// ────────────────────────────────────────────────────────
// Haversine — distância em linha reta entre dois pontos
// ────────────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  if (
    !Number.isFinite(lat1) || !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) || !Number.isFinite(lon2)
  ) return null;

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(2);
}

// ────────────────────────────────────────────────────────
// Supabase — batch update
// ────────────────────────────────────────────────────────
async function updateSupabase(updates) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("⚠️  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos — pulando Supabase.");
    return 0;
  }

  const endpoint = `${url}/rest/v1/places`;
  let count = 0;
  let errors = 0;

  // PATCH individual por id — atualiza só distance_km sem tocar em outros campos
  // Concorrência de 10 requisições simultâneas para não sobrecarregar
  const CONCURRENCY = 10;

  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const batch = updates.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async ({ id, distanceKm }) => {
        const res = await fetch(`${endpoint}?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ distance_km: distanceKm }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error(`\n  ❌ PATCH id=${id} falhou: ${res.status} ${txt}`);
          errors++;
        } else {
          count++;
        }
      })
    );

    process.stdout.write(`  ✔ Supabase: ${count}/${updates.length} atualizados\r`);
  }

  process.stdout.write("\n");
  if (errors > 0) console.warn(`  ⚠️  ${errors} atualizações falharam`);
  return count;
}

// ────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────
async function main() {
  console.log("🏨 Castro's Park Hotel — Fix Distances");
  console.log(`   Hotel: lat=${HOTEL_LAT} lng=${HOTEL_LNG}`);
  console.log("");

  // 1. Lê places.json
  const raw = await fs.readFile(PLACES_JSON, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  console.log(`📦 places.json: ${places.length} lugares`);

  // 2. Recalcula distâncias
  // --force: sempre envia ao Supabase mesmo sem alteração no JSON
  const forceSupabase = process.argv.includes("--force");
  let fixed = 0;
  let noCoords = 0;
  const supabaseUpdates = [];

  for (const p of places) {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    const newDist = haversine(lat, lng, HOTEL_LAT, HOTEL_LNG);

    if (newDist === null) {
      noCoords++;
      continue;
    }

    const oldDist = p.distanceKm;
    p.distanceKm = newDist;

    const changed = oldDist !== newDist;
    if (changed) {
      fixed++;
      if (Math.abs((oldDist ?? 0) - newDist) > 0.5) {
        console.log(`  ~ ${p.name.slice(0, 45).padEnd(45)} ${String(oldDist ?? "—").padStart(6)} → ${String(newDist).padStart(6)} km`);
      }
    }

    if (changed || forceSupabase) {
      supabaseUpdates.push({ id: p.id, distanceKm: newDist });
    }
  }

  console.log(`\n📏 Recalculados: ${fixed} | Sem coordenadas: ${noCoords} | Sem alteração: ${places.length - fixed - noCoords}`);

  // 3. Salva places.json
  doc.updatedAt = new Date().toISOString();
  await fs.writeFile(PLACES_JSON, JSON.stringify(doc, null, 2), "utf8");
  console.log(`✅ places.json salvo`);

  // 4. Atualiza Supabase
  if (supabaseUpdates.length > 0) {
    console.log(`\n🔄 Atualizando Supabase (${supabaseUpdates.length} lugares)...`);
    const updated = await updateSupabase(supabaseUpdates);
    if (updated > 0) console.log(`✅ Supabase: ${updated} lugares atualizados`);
  } else {
    console.log("✅ Nenhuma alteração necessária no Supabase");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
