/**
 * POST /api/admin/translate
 * Traduz campos de texto para EN e ES via DeepL Free API.
 *
 * Body: { fields: { [key: string]: string } }
 *   Cada valor deve ser texto PT puro ou JSON string {"pt":"...","en":"...","es":"..."}.
 *   Apenas o valor PT é extraído e re-traduzido.
 *
 * Response: { [key: string]: string }
 *   Cada chave retorna JSON string '{"pt":"...","en":"...","es":"..."}'
 */

const DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

function extractPt(field) {
  if (!field) return "";
  if (typeof field === "string" && field.startsWith("{")) {
    try {
      const parsed = JSON.parse(field);
      return parsed.pt || parsed.en || "";
    } catch {}
  }
  return field;
}

async function deeplTranslate(texts, targetLang) {
  if (!texts.length) return [];
  const res = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: texts, target_lang: targetLang, source_lang: "PT" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.translations.map((t) => t.text);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.authorization || "";
  if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!DEEPL_API_KEY) {
    return res.status(500).json({ error: "DEEPL_API_KEY não configurada" });
  }

  const { fields } = req.body || {};
  if (!fields || typeof fields !== "object" || !Object.keys(fields).length) {
    return res.status(400).json({ error: "fields é obrigatório" });
  }

  const keys = Object.keys(fields);
  const ptTexts = keys.map((k) => extractPt(fields[k]));

  // Traduz EN e ES em paralelo
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
