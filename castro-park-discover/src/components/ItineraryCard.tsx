import { useTranslation } from "react-i18next";
import { Clock, Users } from "lucide-react";
import { Itinerary } from "@/types/itinerary";
import { useNavigate } from "react-router-dom";

interface ItineraryCardProps {
  itinerary: Itinerary;
}

export const ItineraryCard = ({ itinerary }: ItineraryCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/itinerary/${itinerary.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/itinerary/${itinerary.id}`);
        }
      }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={itinerary.coverImage}
          alt={itinerary.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Icon */}
        <div className="absolute top-3 left-3 text-3xl">{itinerary.icon}</div>

        {/* Content on image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-xl font-semibold text-white leading-tight mb-1">
            {itinerary.title}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2 mb-3">
            {itinerary.subtitle}
          </p>

          <div className="flex items-center gap-3 text-white/70 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {itinerary.duration}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {itinerary.profile}
            </span>
            <span className="ml-auto text-hotel-gold font-medium">
              {t("itinerary.placesCount", { count: itinerary.places.length })}
            </span>
          </div>
        </div>
      </div>

      {/* Gold border on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-hotel-gold/60 transition-colors duration-300 pointer-events-none" />
    </div>
  );
};
