import { useQuery } from "@tanstack/react-query";
import { Place } from "@/types/place";
import { applyCuration, type CurationDoc } from "@/lib/curation";
import { supabase } from "@/lib/supabase";

export interface PlacesResponse {
  updatedAt?: string;
  source?: string;
  places: Place[];
}

// Converte snake_case do Supabase para o formato Place
const rowToPlace = (row: Record<string, unknown>): Place => ({
  id: row.id as string,
  name: row.name as string,
  category: row.category as string,
  rating: row.rating as number,
  reviewCount: row.review_count as number,
  priceLevel: row.price_level as number,
  priceText: row.price_text as string | null,
  description: row.description as string,
  image: row.image as string | null,
  address: row.address as string,
  latitude: row.latitude as number | undefined,
  longitude: row.longitude as number | undefined,
  phone: row.phone as string | undefined,
  website: row.website as string | undefined,
  hours: (row.hours as string[]) || [],
  tags: (row.tags as string[]) || [],
  subcategories: (row.subcategories as string[]) || [],
  gallery: (row.gallery as string[]) || [],
  sourceUrl: row.source_url as string | undefined,
  openStatusText: row.open_status_text as string | null,
  menuUrl: row.menu_url as string | null,
  distanceKm: row.distance_km as number | undefined,
  hotelRecommended: row.hotel_recommended as boolean,
  hotelScore: row.hotel_score as number | undefined,
});

const fetchFromSupabase = async (): Promise<PlacesResponse> => {
  const { data, error } = await supabase!
    .from("places")
    .select("*")
    .eq("is_active", true)
    .order("hotel_score", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);
  return { places: (data || []).map(rowToPlace), source: "supabase" };
};

// Fallback: JSON estático (usado se Supabase não estiver configurado)
const PLACES_URL = `${import.meta.env.BASE_URL}data/places.json?v=${__BUILD_ID__}`;
const CURATION_URL = `${import.meta.env.BASE_URL}data/curation.json?v=${__BUILD_ID__}`;

const fetchFromJson = async (): Promise<PlacesResponse> => {
  const [placesRes, curationRes] = await Promise.all([
    fetch(PLACES_URL, { cache: "no-store" }),
    fetch(CURATION_URL, { cache: "no-store" }),
  ]);
  if (!placesRes.ok) throw new Error(`Falha ao carregar lugares (${placesRes.status})`);
  const json = (await placesRes.json()) as PlacesResponse;
  const curation: CurationDoc | null = curationRes.ok ? await curationRes.json() : null;
  return { ...json, places: applyCuration(json.places || [], curation) };
};

export const usePlaces = () =>
  useQuery<PlacesResponse>({
    queryKey: ["places", __BUILD_ID__],
    queryFn: supabase ? fetchFromSupabase : fetchFromJson,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
