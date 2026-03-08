import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

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

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
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

    const ALLOWED = ["title", "description", "address", "image", "start_date", "end_date", "link", "category", "is_active"];
    const payload = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => ALLOWED.includes(k)));
    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message || "Erro ao criar evento" });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const ALLOWED = ["title", "description", "address", "image", "start_date", "end_date", "link", "category", "is_active"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.includes(k)));
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message || "Erro ao atualizar evento" });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return res.status(500).json({ error: "Erro ao remover evento" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
