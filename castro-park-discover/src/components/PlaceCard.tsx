import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDirectionsUrl } from "@/lib/maps";
import { Place } from "@/types/place";
import { useNavigate } from "react-router-dom";

interface PlaceCardProps {
  place: Place;
}

export const PlaceCard = ({ place }: PlaceCardProps) => {
  const navigate = useNavigate();

  const fallbackImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";

  const [imgSrc, setImgSrc] = React.useState(place.image || fallbackImage);

  const directionsUrl = getDirectionsUrl(place);

  const renderPriceLevel = (level: number) => {
    return Array.from({ length: 4 }, (_, i) => (
      <DollarSign
        key={i}
        className={cn(
          "h-3 w-3",
          i < level ? "text-hotel-gold" : "text-muted-foreground/30"
        )}
      />
    ));
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/place/${encodeURIComponent(place.id)}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/place/${encodeURIComponent(place.id)}`);
        }
      }}
      className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 hover:border-hotel-gold/50 cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={imgSrc}
          alt={place.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />
        {/* Overlay elegante no hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 backdrop-blur shadow-sm">
          <Star className="h-3.5 w-3.5 fill-rating-star text-rating-star" />
          <span className="text-sm font-semibold">
            {Number.isFinite(place.rating) ? place.rating.toFixed(1) : "N/A"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({place.reviewCount ?? 0})
          </span>
        </div>
        {place.hotelRecommended && (
          <div className="absolute left-2 top-2">
            <span className="rounded-full bg-hotel-gold/90 px-2.5 py-0.5 text-[11px] font-medium text-hotel-charcoal backdrop-blur">
              ✦ Hotel
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold leading-tight group-hover:text-primary transition-colors">{place.name}</h3>
          <div className="flex shrink-0 pt-0.5">{renderPriceLevel(place.priceLevel ?? 0)}</div>
        </div>

        <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{place.address}</span>
        </div>

        {place.distanceKm && (
          <div className="mb-2 flex items-center gap-1 text-xs text-hotel-gold font-medium">
            <Navigation className="h-3 w-3" />
            {place.distanceKm} km do hotel
          </div>
        )}

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {place.description || "Explore este lugar em Goiânia"}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {place.subcategories?.[0] && !["Restaurante", "Bar & Noite", "Atração", "Cultura", "Compras", "Ao ar livre", "Café"].includes(place.subcategories[0]) && (
            <Badge variant="outline" className="text-xs">
              {place.subcategories[0]}
            </Badge>
          )}

          {(place.tags || []).slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Quick actions (do not navigate) */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-hotel-gold/50 text-primary hover:bg-hotel-gold/10 hover:border-hotel-gold hover:text-primary"
          >
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation className="mr-2 h-3.5 w-3.5" />
              Como chegar
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
