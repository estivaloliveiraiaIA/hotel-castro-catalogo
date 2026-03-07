import { BackgroundPaths } from "@/components/BackgroundPaths";

interface HeroProps {
  totalPlaces: number;
  totalCategories: number;
  updatedAt?: string;
}

export const Hero = ({ updatedAt }: HeroProps) => {
  const updatedText = updatedAt ? new Date(updatedAt).toLocaleString("pt-BR") : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-primary/80 py-20 text-primary-foreground md:py-28">
      <BackgroundPaths />
      <div className="container px-4">
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge Castro's Park Hotel */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-hotel-gold/50 bg-hotel-gold/10 px-5 py-2 shadow-[0_0_18px_0_rgba(212,175,55,0.18)] animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <span className="text-hotel-gold text-xs">✦</span>
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-hotel-gold">
              Castro&apos;s Park Hotel
            </span>
            <span className="text-hotel-gold text-xs">✦</span>
          </div>

          {/* Ornamento superior dourado */}
          <div
            className="mb-6 flex items-center justify-center gap-4 animate-fade-up"
            style={{ animationDelay: "120ms" }}
          >
            <div className="h-px w-16 bg-hotel-gold/60" />
            <div className="h-px w-16 bg-hotel-gold/60" />
          </div>

          <p
            className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-hotel-gold/90 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Guia exclusivo para hóspedes
          </p>

          <h2
            className="mb-5 font-serif text-4xl font-semibold sm:text-5xl md:text-6xl animate-fade-up"
            style={{ animationDelay: "320ms" }}
          >
            Descubra Goiânia
          </h2>

          <p
            className="mx-auto mb-8 max-w-lg font-serif text-base italic text-primary-foreground/70 sm:text-lg leading-relaxed animate-fade-up"
            style={{ animationDelay: "440ms" }}
          >
            Uma curadoria pensada para tornar cada momento da sua estadia inesquecível
          </p>

          {updatedText && (
            <p
              className="mt-6 text-xs opacity-40 animate-fade-up"
              style={{ animationDelay: "560ms" }}
            >
              Atualizado em {updatedText}
            </p>
          )}
        </div>
      </div>

      {/* Fade para o background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
