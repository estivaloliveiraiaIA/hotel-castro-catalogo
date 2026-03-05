import { useQuery } from "@tanstack/react-query";
import { Itinerary } from "@/types/itinerary";
import { supabase } from "@/lib/supabase";

const ITINERARIES_URL = `${import.meta.env.BASE_URL}data/itineraries.json?v=${__BUILD_ID__}`;

const fetchFromSupabase = async (): Promise<Itinerary[]> => {
  const { data: rows, error } = await supabase!
    .from("itineraries")
    .select("*, itinerary_places(place_id, order_index, note, suggested_time)")
    .eq("is_active", true)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (rows || []).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    icon: row.icon,
    coverImage: row.cover_image,
    duration: row.duration,
    bestTime: row.best_time,
    profile: row.profile,
    tips: row.tips || [],
    places: ((row.itinerary_places as Array<Record<string, unknown>>) || [])
      .sort((a, b) => (a.order_index as number) - (b.order_index as number))
      .map((p) => ({
        placeId: p.place_id as string,
        order: p.order_index as number,
        note: p.note as string | undefined,
        suggestedTime: p.suggested_time as string | undefined,
      })),
  }));
};

const fetchFromJson = async (): Promise<Itinerary[]> => {
  const response = await fetch(ITINERARIES_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar roteiros (${response.status})`);
  return response.json();
};

export const useItineraries = () =>
  useQuery<Itinerary[]>({
    queryKey: ["itineraries", __BUILD_ID__],
    queryFn: supabase ? fetchFromSupabase : fetchFromJson,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
