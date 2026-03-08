import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = ["pt", "en", "es"] as const;

export function LangSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) as "pt" | "en" | "es";

  const change = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-hotel-gold/20 bg-background/60 p-0.5",
        className
      )}
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => change(lang)}
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-all",
            current === lang
              ? "bg-hotel-gold text-hotel-charcoal"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={current === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
