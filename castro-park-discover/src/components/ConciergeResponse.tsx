import { useNavigate } from "react-router-dom";
import { MapPin, Star, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDirectionsUrl } from "@/lib/maps";
import { type ConciergeResult } from "@/hooks/useConcierge";
import { Place } from "@/types/place";

interface ConciergeResponseProps {
  result: ConciergeResult;
  places: Place[];
}

export const ConciergeResponse = ({ result, places }: ConciergeResponseProps) => {
  const navigate = useNavigate();

  if (result.places.length === 0) {
    return (
      <div className="mt-5 rounded-xl border bg-muted/30 px-5 py-4 text-center text-sm text-muted-foreground">
        {result.message}
      </div>
    );
  }

  const enriched = result.places
    .map((rp) => ({
      ...rp,
      full: places.find((p) => p.id === rp.id) ?? null,
    }))
    .filter((rp) => rp.full !== null || rp.name);

  return (
    <div className="mt-5 space-y-3">
      {result.message && (
        <p className="font-serif text-sm italic text-muted-foreground text-center px-2">
          {result.message}
        </p>
      )}

      <div className="space-y-3">
        {enriched.map((item, index) => {
          const place = item.full;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/place/${encodeURIComponent(item.id)}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/place/${encodeURIComponent(item.id)}`);
                }
              }}
              className="group flex gap-4 rounded-xl border bg-card p-4 hover:border-hotel-gold/40 hover:shadow-md transition-all cursor-pointer"
            >
              {/* Número de ordem */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-hotel-gold/60 text-sm font-bold text-hotel-gold">
                {index + 1}
              </div>

              {/* Thumbnail */}
              {place?.image && (
                <div className="hidden sm:block h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={place.image}
                    alt={item.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif font-semibold leading-tight group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  {place?.hotelRecommended && (
                    <Badge className="shrink-0 text-[10px] border border-hotel-gold/40 bg-hotel-gold/10 text-primary">
                      ✦ Hotel
                    </Badge>
                  )}
                </div>

                {/* Rating e address */}
                {place && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    {place.rating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-rating-star text-rating-star" />
                        {place.rating.toFixed(1)}
                      </span>
                    )}
                    {place.address && (
                      <span className="flex items-center gap-1 line-clamp-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {place.address}
                      </span>
                    )}
                  </div>
                )}

                {/* Razão da recomendação */}
                <p className="text-sm text-foreground/80 mb-1">{item.reason}</p>

                {/* Dica especial */}
                {item.highlight && (
                  <p className="text-xs text-hotel-gold/80 italic">✦ {item.highlight}</p>
                )}

                {/* CTA */}
                {place && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-hotel-gold/40 text-primary hover:bg-hotel-gold/10 h-7 text-xs"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={getDirectionsUrl(place)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation className="mr-1 h-3 w-3" />
                        Como chegar
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
