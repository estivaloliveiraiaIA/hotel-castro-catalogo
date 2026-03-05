import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!verifyToken(req)) return unauthorized(res);

  const { base64, contentType = "image/jpeg", filename = "image.jpg" } = req.body || {};
  if (!base64) return res.status(400).json({ error: "base64 obrigatório" });

  const buffer = Buffer.from(base64, "base64");
  const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
  const name = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("hotel-images")
    .upload(name, buffer, { contentType, upsert: false });

  if (error) return res.status(500).json({ error: error.message });

  const { data: { publicUrl } } = supabase.storage
    .from("hotel-images")
    .getPublicUrl(name);

  return res.status(200).json({ url: publicUrl });
}
