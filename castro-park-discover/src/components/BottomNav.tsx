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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-hotel-gold/20 bg-background/95 backdrop-blur-sm md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
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
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors duration-150",
                isActive
                  ? "text-hotel-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
