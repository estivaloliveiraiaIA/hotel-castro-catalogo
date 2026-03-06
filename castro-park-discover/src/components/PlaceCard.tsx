import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, DollarSign, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDirectionsUrl } from "@/lib/maps";
import { Place } from "@/types/place";
import { Partner } from "@/types/partner";
import { useNavigate } from "react-router-dom";
import { PartnerBadge } from "@/components/PartnerBadge";
import { FavoriteButton } from "@/components/FavoriteButton";

interface PlaceCardProps {
  place: Place;
  partner?: Partner;
}

export const PlaceCard = ({ place, partner }: PlaceCardProps) => {
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
      className="group overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_-8px_hsl(var(--hotel-gold)/0.35)] hover:border-hotel-gold/60 cursor-pointer"
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
        {/* Status aberto */}
        {place.openStatusText?.toLowerCase().includes("aberto") && (
          <span
            aria-label="Aberto agora"
            className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-green-600 backdrop-blur shadow-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Aberto
          </span>
        )}
        <FavoriteButton placeId={place.id} className="absolute right-2 top-2" />
        <div className="absolute right-10 top-2 flex items-center gap-1 rounded-full bg-background/95 px-2 py-1 backdrop-blur shadow-sm">
          <Star className="h-3.5 w-3.5 fill-rating-star text-rating-star" />
          <span className="text-sm font-semibold">
            {Number.isFinite(place.rating) ? place.rating.toFixed(1) : "N/A"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({place.reviewCount ?? 0})
          </span>
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {place.hotelRecommended && (
            <span className="rounded-full bg-hotel-gold/90 px-2.5 py-0.5 text-[11px] font-medium text-hotel-charcoal backdrop-blur">
              ✦ Hotel
            </span>
          )}
          {partner && (
            <PartnerBadge label={partner.badgeLabel} size="sm" className="bg-background/90 backdrop-blur" />
          )}
        </div>
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
