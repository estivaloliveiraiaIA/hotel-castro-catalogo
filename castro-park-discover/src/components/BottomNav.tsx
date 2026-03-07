import { Home, Map, CalendarDays, Sparkles, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Guia", href: "/", icon: Home },
  { label: "Roteiros", href: "/itineraries", icon: Map },
  { label: "Favoritos", href: "/recomendados", icon: Heart },
  { label: "Eventos", href: "/events", icon: CalendarDays },
  { label: "Concierge", href: "/", icon: Sparkles, scrollTo: "concierge-section" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();

  const handleScrollClick = (e: React.MouseEvent, sectionId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-hotel-gold/25 bg-background/90 backdrop-blur-md shadow-[0_8px_32px_-4px_rgba(0,0,0,0.25),0_0_0_1px_hsl(var(--hotel-gold)/0.08)] px-2 py-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon, scrollTo }) => {
          const isActive =
            label === "Guia"
              ? pathname === "/"
              : label === "Concierge"
              ? false
              : href !== "/" && pathname.startsWith(href);

          return (
            <Link
              key={label}
              to={href}
              onClick={scrollTo ? (e) => handleScrollClick(e, scrollTo) : undefined}
              aria-label={label}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3.5 py-1.5 text-[10px] font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "text-hotel-gold bg-hotel-gold/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-all duration-200", isActive && "stroke-[2.5] scale-110")} />
              {label}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-hotel-gold" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
