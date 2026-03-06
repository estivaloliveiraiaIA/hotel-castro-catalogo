import { Place } from "@/types/place";

// Coordenadas do Castro's Park Hotel — Av. República do Líbano, 1520, St. Oeste, Goiânia
// Plus Code: 8PCJ+6W St. Oeste, Goiânia - GO
export const HOTEL_COORDS = {
  lat: -16.6794,
  lng: -49.2677,
};

export function getGoogleMapsUrl(place: Place): string {
  if (place.sourceUrl) return place.sourceUrl;

  // Preferir coordenadas quando disponíveis.
  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    const url = new URL("https://www.google.com/maps/search/");
    url.searchParams.set("api", "1");
    url.searchParams.set("query", `${place.latitude},${place.longitude}`);
    return url.toString();
  }

  const query = [place.name, place.address].filter(Boolean).join(" ");
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", query || "Goiânia");
  return url.toString();
}

export function getDirectionsUrl(place: Place): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${HOTEL_COORDS.lat},${HOTEL_COORDS.lng}`);

  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    url.searchParams.set("destination", `${place.latitude},${place.longitude}`);
  } else {
    const destination = [place.name, place.address].filter(Boolean).join(" ");
    url.searchParams.set("destination", destination || "Goiânia");
  }

  return url.toString();
}
