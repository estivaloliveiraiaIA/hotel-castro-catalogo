import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (!verifyToken(req)) return unauthorized(res);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*, itinerary_places(id, place_id, order_index, note, suggested_time, places(id, name))")
      .order("created_at");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { places: stops, ...itinerary } = req.body;
    const { data: row, error } = await supabase
      .from("itineraries")
      .insert(itinerary)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    if (stops && stops.length > 0) {
      const stopsToInsert = stops.map((s, i) => ({
        itinerary_id: row.id,
        place_id: s.place_id,
        order_index: s.order_index ?? i,
        note: s.note,
        suggested_time: s.suggested_time,
      }));
      const { error: stopsError } = await supabase.from("itinerary_places").insert(stopsToInsert);
      if (stopsError) return res.status(500).json({ error: stopsError.message });
    }

    return res.status(201).json(row);
  }

  if (req.method === "PUT") {
    const { id, places: stops, ...updates } = req.body;
    if (!id) return res.status(400).json({ error: "id obrigatório" });

    const { data: row, error } = await supabase
      .from("itineraries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    if (stops !== undefined) {
      await supabase.from("itinerary_places").delete().eq("itinerary_id", id);
      if (stops.length > 0) {
        const stopsToInsert = stops.map((s, i) => ({
          itinerary_id: id,
          place_id: s.place_id,
          order_index: s.order_index ?? i,
          note: s.note,
          suggested_time: s.suggested_time,
        }));
        const { error: stopsError } = await supabase.from("itinerary_places").insert(stopsToInsert);
        if (stopsError) return res.status(500).json({ error: stopsError.message });
      }
    }

    return res.status(200).json(row);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id obrigatório" });
    await supabase.from("itinerary_places").delete().eq("itinerary_id", id);
    const { error } = await supabase.from("itineraries").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
