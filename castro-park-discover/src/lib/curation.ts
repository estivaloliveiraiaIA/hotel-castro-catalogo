import { Place } from "@/types/place";

export interface PlaceOverride {
  name?: string;
  description?: string;
  tags?: string[];
  highlights?: string[];
  notes?: string;
  priority?: number;
}

export interface CurationDoc {
  recommendedIds?: string[];
  overrides?: Record<string, PlaceOverride>;
}

function fallbackDescription(place: Place): string {
  const category = (place.category || "").toLowerCase();

  if (category === "restaurants") {
    return `Restaurante bem avaliado em Goiânia, ótimo para almoço e jantar com fácil acesso saindo do Castro's Park Hotel.`;
  }
  if (category === "nightlife") {
    return `Bar e vida noturna em Goiânia, ideal para curtir a noite com boa localização para hóspedes do hotel.`;
  }
  if (category === "cafes") {
    return `Café especial e ambiente agradável em Goiânia, uma ótima parada para pausa durante o dia.`;
  }
  if (category === "nature") {
    return `Opção de lazer ao ar livre em Goiânia, recomendada para caminhar e aproveitar a cidade.`;
  }
  if (category === "culture") {
    return `Ponto cultural em Goiânia para conhecer melhor a cena local e enriquecer seu roteiro.`;
  }
  if (category === "shopping") {
    return `Opção de compras em Goiânia com boa estrutura para passeios rápidos ou mais completos.`;
  }

  return `Lugar recomendado para conhecer Goiânia durante sua estadia no Castro's Park Hotel.`;
}

function scorePlace(place: Place): number {
  const rating = Math.max(0, Number(place.rating || 0));
  const reviews = Math.max(0, Number(place.reviewCount || 0));
  const distance = Number.isFinite(place.distanceKm) ? Number(place.distanceKm) : 8;

  const ratingScore = rating * 25;
  const reviewsScore = Math.log10(reviews + 1) * 20;
  const distancePenalty = Math.min(distance, 20) * 1.5;

  return +(ratingScore + reviewsScore - distancePenalty).toFixed(2);
}

export function applyCuration(places: Place[], curation?: CurationDoc | null): Place[] {
  const overrides = curation?.overrides || {};

  const normalized = places.map((p) => {
    const ov = overrides[p.id] || overrides[p.sourceId || ""];

    const description = (ov?.description || p.description || "").trim() || fallbackDescription(p);

    const next: Place = {
      ...p,
      name: ov?.name || p.name,
      description,
      tags: ov?.tags?.length ? ov.tags : p.tags,
      highlights: ov?.highlights?.length ? ov.highlights : p.highlights,
      notes: ov?.notes || p.notes,
      hotelScore: scorePlace(p) + (ov?.priority || 0),
      hotelRecommended: false,
    };

    return next;
  });

  const recommendedSet = new Set<string>();
  const manual = (curation?.recommendedIds || []).filter(Boolean);

  if (manual.length > 0) {
    manual.forEach((id) => recommendedSet.add(id));
  } else {
    normalized
      .filter((p) => Number(p.rating || 0) >= 4.2)
      .sort((a, b) => (b.hotelScore || 0) - (a.hotelScore || 0))
      .slice(0, 30)
      .forEach((p) => recommendedSet.add(p.id));
  }

  return normalized.map((p) => ({
    ...p,
    hotelRecommended: recommendedSet.has(p.id) || (p.sourceId ? recommendedSet.has(p.sourceId) : false),
  }));
}
