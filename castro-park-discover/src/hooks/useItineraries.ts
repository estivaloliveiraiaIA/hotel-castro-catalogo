import { useQuery } from "@tanstack/react-query";
import { Itinerary } from "@/types/itinerary";

const ITINERARIES_URL = `${import.meta.env.BASE_URL}data/itineraries.json?v=${__BUILD_ID__}`;

const fetchItineraries = async (): Promise<Itinerary[]> => {
  const response = await fetch(ITINERARIES_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Falha ao carregar roteiros (${response.status})`);
  }
  return response.json();
};

export const useItineraries = () =>
  useQuery<Itinerary[]>({
    queryKey: ["itineraries", __BUILD_ID__],
    queryFn: fetchItineraries,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
