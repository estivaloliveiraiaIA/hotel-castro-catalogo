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
      className="group overflow-hidden transition-all hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imgSrc}
          alt={place.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 backdrop-blur">
          <Star className="h-4 w-4 fill-rating-star text-rating-star" />
          <span className="text-sm font-semibold">
            {Number.isFinite(place.rating) ? place.rating.toFixed(1) : "N/A"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({place.reviewCount ?? 0})
          </span>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-tight">{place.name}</h3>
          <div className="flex shrink-0">{renderPriceLevel(place.priceLevel ?? 0)}</div>
        </div>
        
        <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{place.address}</span>
        </div>

        {place.distanceKm && (
          <div className="mb-2 text-xs text-hotel-gold font-medium">
            📍 {place.distanceKm} km do hotel
          </div>
        )}

        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {place.description || "Explore este lugar em Goiânia"}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {place.hotelRecommended && (
            <Badge className="text-xs bg-hotel-gold text-hotel-charcoal hover:bg-hotel-gold/90">
              Recomendado pelo hotel
            </Badge>
          )}

          {place.subcategories?.[0] && !["Restaurante", "Bar & Noite", "Atração", "Cultura", "Compras", "Ao ar livre", "Café"].includes(place.subcategories[0]) && (
            <Badge variant="outline" className="text-xs">
              {place.subcategories[0]}
            </Badge>
          )}

          {(place.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Quick actions (do not navigate) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Como chegar
            </a>
          </Button>
          {/* Removido: botão "Ver no Maps" ("Como chegar" já atende) */}
        </div>
      </CardContent>
    </Card>
  );
};
