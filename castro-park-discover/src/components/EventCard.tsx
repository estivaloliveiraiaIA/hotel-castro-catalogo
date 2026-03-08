import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/types/event";

const fallbackImage =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80&auto=format&fit=crop";

const formatEventDate = (startDate: string, endDate: string | null): string => {
  const start = new Date(startDate + "T12:00:00");
  const currentYear = new Date().getFullYear();

  const formatDate = (d: Date) => {
    const day = d.getDate();
    const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const year = d.getFullYear() !== currentYear ? ` ${d.getFullYear()}` : "";
    return `${day} ${month}${year}`;
  };

  if (!endDate || endDate === startDate) return formatDate(start);

  const end = new Date(endDate + "T12:00:00");
  return `${formatDate(start)} — ${formatDate(end)}`;
};

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  const [imgSrc, setImgSrc] = React.useState(event.image || fallbackImage);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCardClick = () => navigate(`/event/${event.id}`);

  return (
    <Card
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardClick(); } }}
      className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 hover:border-hotel-gold/50 cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
        <img
          src={imgSrc}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
        {event.category && (
          <div className="absolute left-2 top-2">
            <Badge className="bg-background/90 text-foreground text-[11px] backdrop-blur">
              {event.category}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-hotel-gold">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatEventDate(event.startDate, event.endDate)}
        </div>

        <h3 className="font-serif text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}

        {event.address && (
          <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{event.address}</span>
          </div>
        )}

        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          {t("events.seeDetails")}
          <ArrowRight className="h-3 w-3" />
        </span>
      </CardContent>
    </Card>
  );
};
