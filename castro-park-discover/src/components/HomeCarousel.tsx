import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface HomeCarouselProps {
  items: React.ReactNode[];
  /** Tailwind basis classes for slide width, e.g. "basis-[85%] sm:basis-[48%] lg:basis-[34%]" */
  slideBasis?: string;
  autoplayDelay?: number;
  label?: string;
}

export const HomeCarousel = ({
  items,
  slideBasis = "basis-[85%] sm:basis-[48%] lg:basis-[34%]",
  autoplayDelay = 4500,
  label = "Carousel",
}: HomeCarouselProps) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true })
  );

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    return () => { api.off("select", () => {}); };
  }, [api]);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
    plugin.current.reset();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
    plugin.current.reset();
  }, [api]);

  return (
    <div className="relative group/carousel">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        plugins={[plugin.current]}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        aria-label={label}
      >
        <CarouselContent className="-ml-4">
          {items.map((item, i) => (
            <CarouselItem key={i} className={cn("pl-4", slideBasis)}>
              {item}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Nav arrows — visible on hover on desktop */}
      {count > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Slide anterior"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10",
              "hidden md:flex items-center justify-center",
              "h-9 w-9 rounded-full border border-hotel-gold/40 bg-background/90 backdrop-blur-sm shadow-lg",
              "text-hotel-gold/70 hover:text-hotel-gold hover:border-hotel-gold/70 hover:bg-background",
              "transition-all duration-200",
              "opacity-0 group-hover/carousel:opacity-100"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Próximo slide"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10",
              "hidden md:flex items-center justify-center",
              "h-9 w-9 rounded-full border border-hotel-gold/40 bg-background/90 backdrop-blur-sm shadow-lg",
              "text-hotel-gold/70 hover:text-hotel-gold hover:border-hotel-gold/70 hover:bg-background",
              "transition-all duration-200",
              "opacity-0 group-hover/carousel:opacity-100"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="mt-5 flex justify-center items-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                api?.scrollTo(i);
                plugin.current.reset();
              }}
              aria-label={`Ir para slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 ease-out",
                i === current
                  ? "w-5 bg-hotel-gold"
                  : "w-1.5 bg-hotel-gold/25 hover:bg-hotel-gold/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
