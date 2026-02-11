export interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  priceText?: string;
  description: string;
  image: string | null;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string | null;
  website?: string;
  hours?: string[];
  tags: string[];
  sourceUrl?: string;
  sourceId?: string;
  openStatusCategory?: string | null;
  openStatusText?: string | null;
  menuUrl?: string | null;
  reviews?: {
    text: string;
    url?: string;
  }[];
  categories?: string[];
  gallery?: string[];
  highlights?: string[];
  notes?: string;
  originQueries?: string[];
}
