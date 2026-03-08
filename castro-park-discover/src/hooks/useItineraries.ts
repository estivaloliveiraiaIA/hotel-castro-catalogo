import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Itinerary } from "@/types/itinerary";
import { supabase } from "@/lib/supabase";
import { resolveI18nField, type I18nField } from "@/lib/i18nField";

const ITINERARIES_URL = `${import.meta.env.BASE_URL}data/itineraries.json?v=${__BUILD_ID__}`;

const fetchFromSupabase = async (lang: string): Promise<Itinerary[]> => {
  const { data: rows, error } = await supabase!
    .from("itineraries")
    .select("*, itinerary_places(place_id, order_index, note, suggested_time)")
    .eq("is_active", true)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (rows || []).map((row) => ({
    id: row.id,
    title: resolveI18nField(row.title as I18nField, lang) || (row.title as string),
    subtitle: resolveI18nField(row.subtitle as I18nField, lang) || (row.subtitle as string),
    icon: row.icon,
    coverImage: row.cover_image,
    duration: resolveI18nField(row.duration as I18nField, lang) || (row.duration as string),
    bestTime: row.best_time,
    profile: resolveI18nField(row.profile as I18nField, lang) || (row.profile as string),
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

export const useItineraries = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || "pt";

  return useQuery<Itinerary[]>({
    queryKey: ["itineraries", __BUILD_ID__, lang],
    queryFn: supabase ? () => fetchFromSupabase(lang) : fetchFromJson,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
};
