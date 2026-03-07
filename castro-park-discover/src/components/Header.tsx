import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Guia", href: "/" },
  { label: "Recomendados", href: "/recomendados" },
  { label: "Eventos", href: "/events" },
];

export const Header = () => {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hotel-gold/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4">
        <div className="flex h-16 items-center gap-3 md:gap-6">
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-[0.12em] text-primary sm:text-2xl hover:text-primary/80 transition-colors shrink-0"
          >
            Castro&apos;s Park Hotel
          </Link>
          <span className="hidden text-hotel-gold/30 md:block" aria-hidden>|</span>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  to={href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm tracking-wide rounded-md transition-colors duration-200",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-hotel-gold animate-fade-up" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
