const APIFY_TOKEN = process.env.APIFY_TOKEN;
const MAPS_URL = "https://www.google.com/maps/place/King+Experience+-+Cafeteria+e+Escola+de+Caf%C3%A9/@-16.6864,-49.2664,17z";

async function testActor(actorId, body) {
  console.log(`\nTestando actor: ${actorId}`);
  const start = Date.now();
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=55`,
    {
      method: "POST",
      signal: AbortSignal.timeout(57000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Status: ${res.status} em ${elapsed}s`);
  const data = await res.json();
  if (!res.ok) {
    console.error("Erro:", JSON.stringify(data).slice(0, 300));
    return null;
  }
  const p = Array.isArray(data) ? data[0] : null;
  if (!p) { console.log("Array vazio"); return null; }
  console.log("✅ Dados retornados:");
  console.log("  title:", p.title || p.name);
  console.log("  address:", p.address);
  console.log("  phone:", p.phone);
  console.log("  website:", p.website);
  console.log("  rating:", p.totalScore);
  console.log("  price:", p.price);
  console.log("  lat:", p.location?.lat, "lng:", p.location?.lng);
  console.log("  imageUrl:", p.imageUrl ? "SIM" : "NÃO");
  console.log("  images:", Array.isArray(p.images) ? p.images.length + " fotos" : "NÃO");
  console.log("  openingHours:", JSON.stringify(p.openingHours)?.slice(0, 120));
  console.log("  categoryName:", p.categoryName);
  console.log("  placeId:", p.placeId);
  console.log("  CAMPOS COMPLETOS:", Object.keys(p).join(", "));
  return p;
}

// Testa: compass~google-maps-extractor com searchStringsArray (busca por nome)
await testActor("compass~google-maps-extractor", {
  searchStringsArray: ["King Experience Cafeteria Goiânia"],
  locationQuery: "Goiânia, GO, Brasil",
  maxCrawledPlacesPerSearch: 1,
  deeperCityScrape: false,
  skipClosedPlaces: false,
});
