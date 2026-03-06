import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeCarouselProps {
  items: React.ReactNode[];
  slideBasis?: string; // mantido para compatibilidade, não usado no modo 3D
  autoplayDelay?: number;
  label?: string;
}

export const HomeCarousel = ({
  items,
  autoplayDelay = 4500,
  label = "Carousel",
}: HomeCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = items.length;

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, autoplayDelay);
  }, [count, autoplayDelay]);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoplay]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + count) % count);
    startAutoplay();
  }, [count, startAutoplay]);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % count);
    startAutoplay();
  }, [count, startAutoplay]);

  // Posição relativa ao item central (com wrap-around circular)
  const getPos = (i: number) => {
    let pos = i - current;
    if (pos > count / 2) pos -= count;
    if (pos < -count / 2) pos += count;
    return pos;
  };

  return (
    <div
      aria-label={label}
      className="relative"
      onMouseEnter={() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }}
      onMouseLeave={startAutoplay}
    >
      {/* Container 3D */}
      <div
        className="relative h-[360px] md:h-[420px] overflow-visible"
        style={{ perspective: "1200px" }}
      >
        {items.map((item, i) => {
          const pos = getPos(i);
          const absPos = Math.abs(pos);
          const visible = absPos <= 2;

          const scale = 1 - absPos * 0.16;
          const opacity = absPos === 0 ? 1 : absPos === 1 ? 0.65 : absPos === 2 ? 0.35 : 0;
          const blur = absPos === 0 ? 0 : absPos * 2;
          const rotateY = pos * -8;
          const zIndex = 10 - absPos;

          return (
            <div
              key={i}
              onClick={() => {
                if (pos > 0) next();
                else if (pos < 0) prev();
              }}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "min(300px, 78vw)",
                transform: `translateX(calc(-50% + ${pos * 50}%)) scale(${scale}) rotateY(${rotateY}deg)`,
                opacity: visible ? opacity : 0,
                filter: blur > 0 ? `blur(${blur}px)` : "none",
                zIndex,
                transition: "all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                cursor: pos !== 0 ? "pointer" : "default",
                pointerEvents: visible ? "auto" : "none",
              }}
            >
              {item}
            </div>
          );
        })}
      </div>

      {/* Setas de navegação */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className={cn(
              "absolute left-2 md:-left-4 top-1/2 -translate-y-8 z-20",
              "flex items-center justify-center",
              "h-9 w-9 rounded-full border border-hotel-gold/40 bg-background/90 backdrop-blur-sm shadow-lg",
              "text-hotel-gold/70 hover:text-hotel-gold hover:border-hotel-gold/70",
              "transition-all duration-200"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className={cn(
              "absolute right-2 md:-right-4 top-1/2 -translate-y-8 z-20",
              "flex items-center justify-center",
              "h-9 w-9 rounded-full border border-hotel-gold/40 bg-background/90 backdrop-blur-sm shadow-lg",
              "text-hotel-gold/70 hover:text-hotel-gold hover:border-hotel-gold/70",
              "transition-all duration-200"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dots indicadores */}
      {count > 1 && (
        <div className="mt-6 flex justify-center items-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i);
                startAutoplay();
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
