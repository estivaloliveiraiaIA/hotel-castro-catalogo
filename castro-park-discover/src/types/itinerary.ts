export interface ItineraryPlace {
  placeId: string;
  order: number;
  note?: string;
  suggestedTime?: string;
}

export interface Itinerary {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  coverImage: string;
  duration: string;
  bestTime: string;
  profile: string;
  places: ItineraryPlace[];
  tips: string[];
}
