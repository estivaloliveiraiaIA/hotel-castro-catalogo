import { useQuery } from "@tanstack/react-query";
import { Place } from "@/types/place";

interface PlacesResponse {
  updatedAt?: string;
  location?: {
    query?: string;
    location_id?: string;
  };
  places: Place[];
}

const PLACES_URL = "/data/places.json";

const fetchPlaces = async (): Promise<Place[]> => {
  const response = await fetch(PLACES_URL);
  if (!response.ok) {
    throw new Error(`Falha ao carregar lugares (${response.status})`);
  }

  const json = (await response.json()) as PlacesResponse;
  return json.places ?? [];
};

export const usePlaces = () =>
  useQuery<Place[]>({
    queryKey: ["places"],
    queryFn: fetchPlaces,
    staleTime: 1000 * 60 * 60 * 12, // 12h - dados mudam pouco
    gcTime: 1000 * 60 * 60 * 24,
  });
