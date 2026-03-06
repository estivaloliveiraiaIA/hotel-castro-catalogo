import { useMemo } from "react";
import { Heart, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlaces } from "@/hooks/usePlaces";
import { usePartners } from "@/hooks/usePartners";
import { SkeletonGrid } from "@/components/PlaceCardSkeleton";

const Favorites = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { data, isLoading } = usePlaces();
  const { data: partners } = usePartners();

  const favoritePlaces = useMemo(() => {
    if (!data?.places) return [];
    return data.places.filter((p) => favorites.includes(p.id));
  }, [data, favorites]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Header />

      <main className="container px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Início
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-hotel-gold/60" />
            <span className="text-hotel-gold text-xs">✦</span>
            <div className="h-px w-8 bg-hotel-gold/60" />
          </div>
          <h1 className="font-serif text-3xl font-semibold md:text-4xl mb-2">
            Minha Goiânia
          </h1>
          <p className="text-muted-foreground">
            Seus lugares favoritos durante a estadia
          </p>
        </div>

        {isLoading && <SkeletonGrid count={6} />}

        {!isLoading && favoritePlaces.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="font-serif text-lg font-semibold text-foreground/70">
                Ainda não há favoritos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Explore o guia e salve os lugares que mais te interessam
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Explorar lugares
            </Button>
          </div>
        )}

        {!isLoading && favoritePlaces.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favoritePlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                partner={partners?.find((p) => p.placeId === place.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;
