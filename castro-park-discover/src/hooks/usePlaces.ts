import { useQuery } from "@tanstack/react-query";
import { Place } from "@/types/place";

export interface PlacesResponse {
  updatedAt?: string;
  source?: string;
  places: Place[];
}

// Cache-bust on each deploy to avoid users seeing stale data.
const PLACES_URL = `${import.meta.env.BASE_URL}data/places.json?v=${__BUILD_ID__}`;

const fetchPlacesDoc = async (): Promise<PlacesResponse> => {
  const response = await fetch(PLACES_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar lugares (${response.status})`);
  }

  const json = (await response.json()) as PlacesResponse;
  return json;
};

export const usePlaces = () =>
  useQuery<PlacesResponse>({
    queryKey: ["places", __BUILD_ID__],
    queryFn: fetchPlacesDoc,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
