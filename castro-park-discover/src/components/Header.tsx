import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-hotel-gold/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4">
        <div className="flex h-16 items-center gap-3 md:gap-4">
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-[0.12em] text-primary sm:text-2xl hover:text-primary/80 transition-colors"
          >
            Castro&apos;s Park Hotel
          </Link>
          <span className="hidden text-hotel-gold/50 md:block" aria-hidden>|</span>
          <nav className="hidden items-center gap-4 md:flex">
            <Link to="/" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">
              Guia
            </Link>
            <Link to="/recomendados" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">
              Recomendados
            </Link>
            <Link to="/events" className="text-sm tracking-wide text-muted-foreground hover:text-foreground transition-colors">
              Eventos
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
