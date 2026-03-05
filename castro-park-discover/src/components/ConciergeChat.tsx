import { useState, useRef } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConcierge } from "@/hooks/useConcierge";
import { ConciergeResponse } from "@/components/ConciergeResponse";
import { Place } from "@/types/place";

interface ConciergeChatProps {
  places: Place[];
}

const SUGGESTIONS = [
  "Jantar romântico",
  "Passeio com filhos",
  "Café especial",
  "Vida noturna",
  "Compras",
];

export const ConciergeChat = ({ places }: ConciergeChatProps) => {
  const [query, setQuery] = useState("");
  const { search, clear, result, loading, error } = useConcierge();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) search(query);
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    search(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    clear();
    inputRef.current?.focus();
  };

  return (
    <section className="border-b bg-gradient-to-b from-primary/8 to-background py-8">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl">

          {/* Header da seção */}
          <div className="mb-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-hotel-gold/10 border border-hotel-gold/25 px-4 py-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-hotel-gold" />
              <span className="text-xs font-medium text-hotel-gold tracking-wide">Concierge Digital</span>
            </div>
            <p className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
              O que você procura hoje?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Descreva em suas palavras — o concierge encontra os melhores lugares para você
            </p>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: quero jantar bem esta noite..."
                className="rounded-full pl-5 pr-10 h-12 border-hotel-gold/30 focus-visible:border-hotel-gold/60 focus-visible:ring-hotel-gold/20 text-base"
                disabled={loading}
              />
              {(query || result) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-5 shrink-0 h-12"
              disabled={loading || query.trim().length < 3}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                </span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Suggestions */}
          {!result && !loading && (
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  aria-label={`Buscar: ${s}`}
                  className="rounded-full border border-hotel-gold/30 bg-background px-3 py-1 text-xs text-muted-foreground hover:border-hotel-gold/60 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="mt-4 text-center">
              <p className="font-serif text-sm italic text-muted-foreground">
                O concierge está buscando as melhores opções para você...
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
              {error}
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <ConciergeResponse result={result} places={places} />
          )}
        </div>
      </div>
    </section>
  );
};
