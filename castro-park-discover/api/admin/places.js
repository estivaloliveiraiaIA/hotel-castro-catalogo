import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

// ─── DeepL translation helper ────────────────────────────────────────────────
const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

function extractPt(field) {
  if (!field) return "";
  if (typeof field === "string" && field.startsWith("{")) {
    try { const p = JSON.parse(field); return p.pt || p.en || ""; } catch {}
  }
  return field;
}

async function deeplTranslate(texts, targetLang) {
  if (!texts.length) return [];
  const res = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: texts, target_lang: targetLang, source_lang: "PT" }),
  });
  if (!res.ok) { const b = await res.text(); throw new Error(`DeepL ${res.status}: ${b}`); }
  return (await res.json()).translations.map((t) => t.text);
}

const ALLOWED_FIELDS = [
  "id", "name", "category", "subcategories", "rating", "price_level",
  "description", "image", "gallery", "address", "phone", "website",
  "hotel_recommended", "hotel_score", "is_active", "hours", "tags",
  "menu_url", "distance_km",
];

function pickAllowed(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
}

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { id } = req.query;

    // GET ?id=xxx — busca lugar completo (com gallery) para o formulário de edição
    if (id) {
      const { data, error } = await supabase
        .from("places")
        .select("id, name, category, subcategories, rating, price_level, description, image, gallery, address, phone, website, hotel_recommended, hotel_score, is_active, hours, tags, menu_url, distance_km")
        .eq("id", id)
        .single();
      if (error) return res.status(404).json({ error: `Lugar não encontrado: ${error.message}` });
      return res.status(200).json(data);
    }

    // GET sem id — listagem geral sem gallery completa (payload reduzido para 500 registros)
    const { data, error } = await supabase
      .from("places")
      .select("id, name, category, subcategories, rating, price_level, description, image, gallery, address, phone, website, hotel_recommended, hotel_score, is_active, hours, tags, menu_url, distance_km")
      .order("hotel_score", { ascending: false, nullsFirst: false });
    if (error) return res.status(500).json({ error: `Erro ao buscar lugares: ${error.message}` });
    // Transforma gallery em gallery_count para reduzir payload
    const list = (data || []).map(({ gallery, ...rest }) => ({
      ...rest,
      gallery_count: Array.isArray(gallery) ? gallery.length : 0,
    }));
    return res.status(200).json(list);
  }

  if (req.method === "POST") {
    // action=translate: traduz campos PT → EN+ES via DeepL
    if ((req.body || {}).action === "translate") {
      const { fields } = req.body;
      if (!fields || !Object.keys(fields).length)
        return res.status(400).json({ error: "fields é obrigatório" });
      if (!process.env.DEEPL_API_KEY)
        return res.status(500).json({ error: "DEEPL_API_KEY não configurada" });
      const keys = Object.keys(fields);
      const ptTexts = keys.map((k) => extractPt(fields[k]));
      const [enTexts, esTexts] = await Promise.all([
        deeplTranslate(ptTexts, "EN"),
        deeplTranslate(ptTexts, "ES"),
      ]);
      const result = {};
      keys.forEach((k, i) => {
        result[k] = JSON.stringify({ pt: ptTexts[i], en: enTexts[i], es: esTexts[i] });
      });
      return res.status(200).json(result);
    }

    const payload = pickAllowed(req.body || {});
    if (!payload.id) payload.id = crypto.randomUUID();
    const { data, error } = await supabase
      .from("places")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(500).json({ error: `Erro ao criar lugar: ${error.message}` });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const updates = pickAllowed(req.body);
    const { data, error } = await supabase
      .from("places")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: "Erro ao atualizar lugar" });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Erro ao remover lugar" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
