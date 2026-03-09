/**
 * Script de teste local para diagnosticar o scraper de lugares.
 * Roda FORA da Vercel, com timeout real de 60s.
 *
 * Uso:
 *   APIFY_TOKEN=xxx ORS_API_KEY=xxx LLM_API_KEY=xxx node scripts/test-scrape.js "URL_DO_GOOGLE_MAPS"
 *
 * Exemplo:
 *   APIFY_TOKEN=apify_api_... node scripts/test-scrape.js "https://maps.app.goo.gl/..."
 */

const HOTEL_LAT = -16.6794;
const HOTEL_LNG = -49.2677;

const url = process.argv[2];
if (!url) {
  console.error("Uso: node scripts/test-scrape.js <URL>");
  process.exit(1);
}

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ORS_API_KEY = process.env.ORS_API_KEY;

async function resolveUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD", redirect: "follow",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    return res.url || url;
  } catch (e) {
    console.warn("[resolveUrl] falhou:", e.message);
    return url;
  }
}

function extractFromUrl(url) {
  const placeMatch = url.match(/\/maps\/place\/([^/@?#]+)/);
  const name = placeMatch
    ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).replace(/_/g, " ")
    : null;
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
  const lng = coordMatch ? parseFloat(coordMatch[2]) : null;
  return { name, lat, lng };
}

async function testApify(placeName) {
  if (!APIFY_TOKEN) { console.log("[apify] APIFY_TOKEN não configurado"); return null; }
  if (!placeName) { console.log("[apify] nome do lugar não extraído da URL"); return null; }
  console.log("\n[apify] buscando por nome:", placeName);
  const start = Date.now();
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/compass~google-maps-extractor/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=55`,
      {
        method: "POST",
        signal: AbortSignal.timeout(57000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: [`${placeName} Goiânia`],
          locationQuery: "Goiânia, GO, Brasil",
          maxCrawledPlacesPerSearch: 1,
          deeperCityScrape: false,
          skipClosedPlaces: false,
        }),
      }
    );
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[apify] resposta em ${elapsed}s — status: ${res.status}`);
    if (!res.ok) {
      const body = await res.text();
      console.error("[apify] erro HTTP:", body.slice(0, 400));
      return null;
    }
    const items = await res.json();
    console.log("[apify] items recebidos:", items?.length ?? 0);
    if (!items?.length) { console.warn("[apify] array vazio"); return null; }
    const p = items[0];
    console.log("[apify] dados do lugar:");
    console.log("  title:", p.title);
    console.log("  address:", p.address);
    console.log("  phone:", p.phone);
    console.log("  website:", p.website);
    console.log("  rating:", p.totalScore);
    console.log("  lat:", p.location?.lat, "lng:", p.location?.lng);
    console.log("  imageUrl:", p.imageUrl ? "SIM" : "NÃO");
    console.log("  images.length:", Array.isArray(p.images) ? p.images.length : 0);
    console.log("  openingHours:", JSON.stringify(p.openingHours)?.slice(0, 100));
    return p;
  } catch (e) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`[apify] erro após ${elapsed}s:`, e.message);
    return null;
  }
}

async function testORS(lat, lng) {
  if (!ORS_API_KEY || !lat || !lng) { console.log("[ors] sem chave ou coords"); return null; }
  const res = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
    method: "POST",
    signal: AbortSignal.timeout(6000),
    headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ locations: [[HOTEL_LNG, HOTEL_LAT], [lng, lat]], metrics: ["distance"] }),
  });
  if (!res.ok) { console.error("[ors] erro HTTP:", res.status); return null; }
  const data = await res.json();
  const meters = data.distances?.[0]?.[1];
  return meters != null ? Math.round((meters / 1000) * 10) / 10 : null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("TESTE DE SCRAPING");
  console.log("URL:", url);
  console.log("=".repeat(60));

  // 1. Resolve URL
  console.log("\n[1] Resolvendo URL...");
  const resolved = await resolveUrl(url);
  console.log("URL resolvida:", resolved);
  const { name, lat, lng } = extractFromUrl(resolved);
  console.log("Nome da URL:", name);
  console.log("Coords da URL:", lat, lng);

  // 2. Apify
  console.log("\n[2] Testando Apify...");
  const apifyResult = await testApify(name);

  // 3. ORS com melhores coords
  console.log("\n[3] Calculando distância ORS...");
  const bestLat = apifyResult?.location?.lat || lat;
  const bestLng = apifyResult?.location?.lng || lng;
  const dist = await testORS(bestLat, bestLng);
  console.log("[ors] distância:", dist, "km (coords usadas:", bestLat, bestLng, ")");
  if (lat && lng && bestLat !== lat) {
    const distUrl = await testORS(lat, lng);
    console.log("[ors] distância com coords da URL (câmera):", distUrl, "km — diferença:", Math.abs((dist||0)-(distUrl||0)).toFixed(1), "km");
  }

  console.log("\n" + "=".repeat(60));
  console.log("RESULTADO FINAL");
  console.log("=".repeat(60));
  console.log("Fonte dos dados:", apifyResult ? "Apify ✅" : "Fallback (somente nome da URL) ❌");
  if (!apifyResult) {
    console.log("\n⚠️  Apify não retornou dados.");
    console.log("Verifique:");
    console.log("  1. APIFY_TOKEN configurado?", !!APIFY_TOKEN);
    console.log("  2. A URL é um link válido do Google Maps?");
    console.log("  3. Créditos Apify disponíveis? https://console.apify.com/billing");
  }
}

main().catch(console.error);
