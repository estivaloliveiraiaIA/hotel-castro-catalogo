import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  placeId: string;
  className?: string;
}

export const FavoriteButton = ({ placeId, className }: FavoriteButtonProps) => {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(placeId);

  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(placeId);
      }}
      className={cn(
        "flex items-center justify-center rounded-full bg-background/90 p-1.5 shadow-sm backdrop-blur transition-transform duration-150 active:scale-90 hover:scale-110",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          active
            ? "fill-hotel-gold text-hotel-gold"
            : "fill-transparent text-muted-foreground"
        )}
      />
    </button>
  );
};
