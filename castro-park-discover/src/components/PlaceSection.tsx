import { Place } from "@/types/place";
import { PlaceCard } from "@/components/PlaceCard";

interface PlaceSectionProps {
  title: string;
  subtitle?: string;
  places: Place[];
}

export const PlaceSection = ({ title, subtitle, places }: PlaceSectionProps) => {
  if (!places.length) return null;

  return (
    <section className="py-6">
      <div className="container px-4">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Mobile: horizontal scroll | Desktop: grid */}
        <div
          className={
            "-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 " +
            "md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 " +
            "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }
        >
          {places.map((place) => (
            <div
              key={place.id}
              className="min-w-[260px] md:min-w-0"
            >
              <PlaceCard place={place} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
