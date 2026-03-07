import * as React from "react";
import { BackgroundPaths } from "@/components/BackgroundPaths";

const HERO_IMAGES = ["/images/hero1.jpg", "/images/hero2.jpg"];
const SLIDE_INTERVAL = 10000; // ms

interface HeroProps {
  totalPlaces: number;
  totalCategories: number;
  updatedAt?: string;
}

export const Hero = ({ updatedAt }: HeroProps) => {
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : null;
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden py-24 text-white md:py-36">
      {/* Slideshow de imagens com crossfade */}
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url('${src}')`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      {/* Overlay escuro com gradiente — mantém legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      {/* BackgroundPaths animado sobre o overlay */}
      <BackgroundPaths />

      <div className="relative container px-4">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge Castro's Park Hotel */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-hotel-gold/50 bg-hotel-gold/10 px-5 py-2 shadow-[0_0_24px_0_rgba(212,175,55,0.22)] backdrop-blur-sm animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <span className="text-hotel-gold text-xs">✦</span>
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-hotel-gold">
              Castro&apos;s Park Hotel
            </span>
            <span className="text-hotel-gold text-xs">✦</span>
          </div>

          {/* Ornamento dourado */}
          <div
            className="mb-6 flex items-center justify-center gap-3 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="h-px w-12 bg-hotel-gold/50" />
            <span className="text-hotel-gold/70 text-sm">✦</span>
            <div className="h-px w-12 bg-hotel-gold/50" />
          </div>

          <p
            className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-hotel-gold/90 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Guia exclusivo para hóspedes
          </p>

          <h2
            className="mb-5 font-serif text-5xl font-semibold sm:text-6xl md:text-7xl animate-fade-up drop-shadow-lg"
            style={{ animationDelay: "320ms" }}
          >
            Descubra Goiânia
          </h2>

          <p
            className="mx-auto mb-8 max-w-lg font-serif text-base italic text-white/75 sm:text-lg leading-relaxed animate-fade-up"
            style={{ animationDelay: "440ms" }}
          >
            Uma curadoria pensada para tornar cada momento da sua estadia inesquecível
          </p>

          {updatedText && (
            <p
              className="mt-4 text-xs text-white/30 animate-fade-up"
              style={{ animationDelay: "560ms" }}
            >
              Atualizado em {updatedText}
            </p>
          )}
        </div>
      </div>

      {/* Fade para o background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
