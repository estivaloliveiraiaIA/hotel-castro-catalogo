import { supabase } from "../_lib/supabase.js";
import { verifyToken, unauthorized } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (!verifyToken(req)) return unauthorized(res);

  const [places, events, itineraries, partners] = await Promise.all([
    supabase.from("places").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("itineraries").select("*", { count: "exact", head: true }),
    supabase.from("partners").select("*", { count: "exact", head: true }),
  ]);

  return res.status(200).json({
    places: places.count ?? 0,
    events: events.count ?? 0,
    itineraries: itineraries.count ?? 0,
    partners: partners.count ?? 0,
  });
}
