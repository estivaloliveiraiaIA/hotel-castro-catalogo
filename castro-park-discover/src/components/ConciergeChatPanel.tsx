import { useEffect, useRef, useState } from "react";
import { Send, Utensils, Baby, Coffee, Moon, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessage, ConciergePlace } from "@/hooks/useConciergeChat";

const SUGGESTIONS = [
  { label: "Jantar romântico", icon: Utensils },
  { label: "Passeio com filhos", icon: Baby },
  { label: "Café especial", icon: Coffee },
  { label: "Vida noturna", icon: Moon },
  { label: "Compras", icon: ShoppingBag },
];

interface ConciergeChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

function PlaceSuggestions({ places, onClose }: { places: ConciergePlace[]; onClose?: () => void }) {
  if (!places.length) return null;
  return (
    <div className="mt-3 space-y-2">
      {places.map((p) => (
        <Link
          key={p.id}
          to={`/place/${encodeURIComponent(p.id)}`}
          onClick={onClose}
          className="block rounded-xl border border-hotel-gold/20 bg-hotel-gold/5 px-3 py-2.5 hover:bg-hotel-gold/10 transition-colors"
        >
          <p className="text-xs font-semibold text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.reason}</p>
        </Link>
      ))}
    </div>
  );
}

export const ConciergeChatPanel = ({
  messages,
  loading,
  error,
  onSend,
  onClear,
  onClose,
}: ConciergeChatPanelProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length >= 2) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleSuggestion = (label: string) => {
    onSend(label);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="font-serif text-sm italic text-muted-foreground leading-relaxed">
                Olá! Sou a concierge digital do Castro's Park Hotel.<br />
                Como posso ajudar você a aproveitar Goiânia?
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => handleSuggestion(label)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hotel-gold/30 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-hotel-gold/60 hover:text-foreground hover:bg-hotel-gold/5 transition-colors"
                >
                  <Icon className="h-3 w-3 text-hotel-gold/70" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-hotel-gold/15 text-foreground rounded-br-sm"
                  : "bg-card border border-border/60 text-foreground rounded-bl-sm"
              )}
            >
              <p className="leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && msg.places && (
                <PlaceSuggestions places={msg.places} onClose={onClose} />
              )}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="h-1.5 w-1.5 rounded-full bg-hotel-gold/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-hotel-gold/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-hotel-gold/60 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer: clear + input */}
      <div className="border-t px-4 py-3 space-y-2">
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Limpar conversa
          </button>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua pergunta..."
            className="rounded-full pl-4 h-10 text-sm border-hotel-gold/30 focus-visible:border-hotel-gold/60 focus-visible:ring-hotel-gold/20"
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            className="rounded-full h-10 w-10 p-0 shrink-0"
            disabled={loading || input.trim().length < 2}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
