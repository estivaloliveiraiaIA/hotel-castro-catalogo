import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(".");
const PLACES_JSON_PATH = path.join(ROOT, "public", "data", "places.json");

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function hasAny(hay, words) {
  return words.some((w) => hay.includes(w));
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function derive(place) {
  const name = norm(place.name);
  const tags = norm((place.tags || []).join(" | "));
  const cats = norm((place.categories || []).join(" | "));
  const blob = `${name} | ${tags} | ${cats}`;

  const out = [];
  const cat = String(place.category || "");

  if (cat === "restaurants") {
    if (hasAny(blob, ["pizza", "pizzaria"])) out.push("Pizza");
    if (hasAny(blob, ["burger", "hamburg", "hamburguer"])) out.push("Hambúrguer");
    if (hasAny(blob, ["japones", "japonesa", "sushi", "temaki", "ramen"])) out.push("Japonesa");
    if (hasAny(blob, ["churrasc", "rodizio", "steak", "grill"])) out.push("Churrasco");
    if (hasAny(blob, ["peixe", "frutos do mar", "camarao", "camarão"])) out.push("Frutos do mar");
    if (hasAny(blob, ["italian", "italiana", "pasta", "trattoria"])) out.push("Italiana");
    if (hasAny(blob, ["mexic", "taco", "burrito"])) out.push("Mexicana");
    if (hasAny(blob, ["arabe", "arabe", "kebab", "esfiha", "sfih"])) out.push("Árabe");
    if (hasAny(blob, ["veg", "vegetar", "vegan"])) out.push("Vegetariano/Vegano");
    if (hasAny(blob, ["padaria", "panificadora"])) out.push("Padaria");
    if (hasAny(blob, ["confeitaria", "doceria", "bolo", "dessert", "sobremesa"])) out.push("Confeitaria");

    // fallback default
    if (out.length === 0) out.push("Restaurante");
  }

  if (cat === "nightlife") {
    if (hasAny(blob, ["pub"])) out.push("Pub");
    if (hasAny(blob, ["cervej", "brew", "chopp"])) out.push("Cervejaria");
    if (hasAny(blob, ["bar"])) out.push("Bar");
    if (hasAny(blob, ["karaoke"])) out.push("Karaokê");
    if (hasAny(blob, ["club", "balada", "boate"])) out.push("Balada/Clube");
    if (hasAny(blob, ["cocktail", "drink", "speakeasy"])) out.push("Coquetelaria");
    if (out.length === 0) out.push("Bar & Noite");
  }

  if (cat === "cafes") {
    if (hasAny(blob, ["cafeteria", "cafe", "café", "coffee"])) out.push("Cafeteria");
    if (hasAny(blob, ["padaria", "panificadora"])) out.push("Padaria");
    if (hasAny(blob, ["confeitaria", "doceria", "bolo", "dessert"])) out.push("Confeitaria");
    if (hasAny(blob, ["brunch"])) out.push("Brunch");
    if (out.length === 0) out.push("Café");
  }

  if (cat === "nature") {
    if (hasAny(blob, ["parque"])) out.push("Parque");
    if (hasAny(blob, ["bosque"])) out.push("Bosque");
    if (hasAny(blob, ["praca", "praça"])) out.push("Praça");
    if (hasAny(blob, ["trilha", "caminhada"])) out.push("Trilha/Caminhada");
    if (out.length === 0) out.push("Ao ar livre");
  }

  if (cat === "culture") {
    if (hasAny(blob, ["museu", "museum"])) out.push("Museu");
    if (hasAny(blob, ["teatro", "theater"])) out.push("Teatro");
    if (hasAny(blob, ["galeria", "arte", "art"])) out.push("Arte/Galeria");
    if (hasAny(blob, ["centro cultural", "cultural"])) out.push("Centro cultural");
    if (out.length === 0) out.push("Cultura");
  }

  if (cat === "shopping") {
    if (hasAny(blob, ["shopping", "mall"])) out.push("Shopping");
    if (hasAny(blob, ["mercado", "feira"])) out.push("Feira/Mercado");
    if (out.length === 0) out.push("Compras");
  }

  if (cat === "attractions") {
    if (hasAny(blob, ["zoo", "zoologico", "zoológico"])) out.push("Zoológico");
    if (hasAny(blob, ["mirante", "vista"])) out.push("Mirante");
    if (hasAny(blob, ["tour", "passeio"])) out.push("Passeio");
    if (out.length === 0) out.push("Atração");
  }

  return uniq(out).slice(0, 3);
}

async function main() {
  const raw = await fs.readFile(PLACES_JSON_PATH, "utf8");
  const doc = JSON.parse(raw);
  const places = Array.isArray(doc.places) ? doc.places : [];

  let changed = 0;
  for (const p of places) {
    const existing = Array.isArray(p.subcategories) ? p.subcategories : [];
    const next = existing.length ? existing : derive(p);
    const before = JSON.stringify(existing);
    const after = JSON.stringify(next);
    if (before !== after) {
      p.subcategories = next;
      changed++;
    }
  }

  doc.updatedAt = new Date().toISOString();
  doc.places = places;

  await fs.writeFile(PLACES_JSON_PATH, JSON.stringify(doc, null, 2), "utf8");
  console.log(`✅ derive-subcategories: places=${places.length} changed=${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
