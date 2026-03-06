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

          {/* Ornamento superior dourado */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-hotel-gold/60" />
            <span className="text-hotel-gold text-lg">✦</span>
            <div className="h-px w-16 bg-hotel-gold/60" />
          </div>

          <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-hotel-gold/90">
            Guia exclusivo para hóspedes
          </p>

          <h2 className="mb-5 font-serif text-4xl font-semibold sm:text-5xl md:text-6xl">
            Descubra Goiânia
          </h2>

          <p className="mx-auto mb-8 max-w-lg font-serif text-base italic text-primary-foreground/70 sm:text-lg leading-relaxed">
            Uma curadoria pensada para tornar cada momento da sua estadia inesquecível
          </p>

          {/* Separador dourado decorativo central */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-6 bg-hotel-gold/50" />
            <span className="text-[10px] text-hotel-gold/70 tracking-[0.4em] uppercase">Castro&apos;s Park Hotel</span>
            <div className="h-px w-6 bg-hotel-gold/50" />
          </div>

          {updatedText && (
            <p className="mt-6 text-xs opacity-40">Atualizado em {updatedText}</p>
          )}
        </div>
      </div>

      {/* Fade para o background */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
