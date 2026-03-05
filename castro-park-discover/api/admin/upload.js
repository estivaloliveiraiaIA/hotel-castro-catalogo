import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_MAP = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!verifyToken(req)) return unauthorized(res);

  const { base64, contentType = "image/jpeg" } = req.body || {};
  if (!base64) return res.status(400).json({ error: "base64 obrigatório" });

  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." });
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ error: "Arquivo muito grande. Máximo 4MB." });
  }

  const ext = EXT_MAP[contentType] || "jpg";
  const name = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("hotel-images")
    .upload(name, buffer, { contentType, upsert: false });

  if (error) return res.status(500).json({ error: "Erro ao fazer upload da imagem" });

  const { data: { publicUrl } } = supabase.storage
    .from("hotel-images")
    .getPublicUrl(name);

  return res.status(200).json({ url: publicUrl });
}
