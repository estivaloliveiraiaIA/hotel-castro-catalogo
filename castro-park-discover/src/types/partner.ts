export interface PartnerPlace {
  id: string;
  name: string;
  category: string | null;
  image: string | null;
  rating: number | null;
}

export interface Partner {
  id: string;
  placeId: string;
  dealDescription: string | null;
  badgeLabel: string;
  place: PartnerPlace;
}
