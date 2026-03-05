import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("places")
      .select("id, name, category, subcategories, rating, price_level, description, image, address, phone, website, hotel_recommended, hotel_score, is_active, hours, tags")
      .order("hotel_score", { ascending: false, nullsFirst: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { data, error } = await supabase
      .from("places")
      .insert(req.body)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { data, error } = await supabase
      .from("places")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    const { error } = await supabase.from("places").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
