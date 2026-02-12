import { useQuery } from "@tanstack/react-query";
import { Place } from "@/types/place";
import { applyCuration, type CurationDoc } from "@/lib/curation";

export interface PlacesResponse {
  updatedAt?: string;
  source?: string;
  places: Place[];
}

// Cache-bust on each deploy to avoid users seeing stale data.
const PLACES_URL = `${import.meta.env.BASE_URL}data/places.json?v=${__BUILD_ID__}`;
const CURATION_URL = `${import.meta.env.BASE_URL}data/curation.json?v=${__BUILD_ID__}`;

const fetchOptionalCuration = async (): Promise<CurationDoc | null> => {
  const response = await fetch(CURATION_URL, { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as CurationDoc;
};

const fetchPlacesDoc = async (): Promise<PlacesResponse> => {
  const [placesRes, curation] = await Promise.all([
    fetch(PLACES_URL, { cache: "no-store" }),
    fetchOptionalCuration(),
  ]);

  if (!placesRes.ok) {
    throw new Error(`Falha ao carregar lugares (${placesRes.status})`);
  }

  const json = (await placesRes.json()) as PlacesResponse;
  return {
    ...json,
    places: applyCuration(json.places || [], curation),
  };
};

export const usePlaces = () =>
  useQuery<PlacesResponse>({
    queryKey: ["places", __BUILD_ID__],
    queryFn: fetchPlacesDoc,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
