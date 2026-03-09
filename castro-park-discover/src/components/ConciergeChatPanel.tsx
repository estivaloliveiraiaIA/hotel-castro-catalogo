import { useEffect, useRef, useState } from "react";
import { Send, Utensils, Baby, Coffee, Moon, ShoppingBag, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessage, ConciergePlace, ConciergeLanguage } from "@/hooks/useConciergeChat";

const SUGGESTIONS = [
  { label: "Jantar romântico", icon: Utensils },
  { label: "Passeio com filhos", icon: Baby },
  { label: "Café especial", icon: Coffee },
  { label: "Vida noturna", icon: Moon },
  { label: "Compras", icon: ShoppingBag },
];

const LOADING_MESSAGES = [
  "Deixa eu verificar as melhores opções para você...",
  "Consultando o guia do hotel...",
  "Procurando o que há de melhor em Goiânia...",
  "Selecionando com carinho para você...",
  "Quase lá, só mais um instante...",
];

const LANGUAGES: { code: ConciergeLanguage; flag: string; label: string; sub: string }[] = [
  { code: "pt", flag: "🇧🇷", label: "Português", sub: "Brasileiro" },
  { code: "en", flag: "🇺🇸", label: "English",   sub: "American" },
  { code: "es", flag: "🇪🇸", label: "Español",   sub: "Latinoamericano" },
];

const WELCOME: Record<ConciergeLanguage, string> = {
  pt: "Olá! Sou a Didi, concierge digital do Castro's Park Hotel.\nComo posso ajudar você a aproveitar Goiânia?",
  en: "Hello! I'm Didi, the digital concierge of Castro's Park Hotel.\nHow can I help you enjoy Goiânia?",
  es: "¡Hola! Soy Didi, la concierge digital del Castro's Park Hotel.\n¿Cómo puedo ayudarte a disfrutar Goiânia?",
};

interface ConciergeChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  language: ConciergeLanguage | null;
  onSelectLanguage: (lang: ConciergeLanguage) => void;
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
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">{p.name}</p>
            <ExternalLink className="h-3 w-3 shrink-0 text-hotel-gold/40 mt-0.5" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.reason}</p>
          {p.highlight && (
            <p className="text-[11px] italic text-hotel-gold/70 mt-1 line-clamp-1">
              ✦ {p.highlight}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

export const ConciergeChatPanel = ({
  messages,
  loading,
  error,
  language,
  onSelectLanguage,
  onSend,
  onClear,
  onClose,
}: ConciergeChatPanelProps) => {
  const [input, setInput] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Roda mensagens de loading humanizadas
  useEffect(() => {
    if (!loading) {
      setLoadingMsgIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [loading]);

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

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Tela de seleção de idioma */}
        {!hasMessages && !loading && !language && (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center mx-auto text-2xl">
                👩‍💼
              </div>
              <p className="font-serif text-base font-medium text-foreground">Didi</p>
              <p className="text-xs text-hotel-gold/70 tracking-wide uppercase">Concierge Digital · Castro's Park</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Escolha seu idioma</p>
              <p className="text-xs text-muted-foreground">Choose your language · Elige tu idioma</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[220px]">
              {LANGUAGES.map(({ code, flag, label, sub }) => (
                <button
                  key={code}
                  onClick={() => onSelectLanguage(code)}
                  className="flex items-center gap-3 w-full rounded-2xl border border-hotel-gold/20 bg-background px-4 py-3 hover:border-hotel-gold/60 hover:bg-hotel-gold/5 transition-all group text-left"
                >
                  <span className="text-2xl">{flag}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-hotel-gold transition-colors">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tela de boas-vindas após seleção de idioma */}
        {!hasMessages && !loading && language && (
          <div className="space-y-4">
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-hotel-gold/10 border border-hotel-gold/30 flex items-center justify-center mx-auto text-xl">
                👩‍💼
              </div>
              <p className="font-serif text-base font-medium text-foreground">Didi</p>
              <p className="text-xs text-hotel-gold/70 tracking-wide uppercase">Concierge Digital · Castro's Park</p>
              <p className="font-serif text-sm italic text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">
                {WELCOME[language]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => onSend(label)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-hotel-gold/30 bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-hotel-gold/60 hover:text-foreground hover:bg-hotel-gold/5 transition-colors"
                >
                  <Icon className="h-3 w-3 text-hotel-gold/70" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensagens */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
              {msg.role === "assistant" && (
                <span className="text-[10px] text-hotel-gold/60 px-1 font-medium tracking-wide">Didi</span>
              )}
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
          </div>
        ))}

        {/* Loading humanizado */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]">
              <p className="text-xs text-muted-foreground italic animate-pulse">
                {LOADING_MESSAGES[loadingMsgIdx]}
              </p>
            </div>
          </div>
        )}

        {/* Erro tipado */}
        {error && (
          <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer — só aparece após idioma selecionado */}
      <div className={cn("border-t px-4 py-3 space-y-2", !language && "hidden")}>

        {/* Chips persistentes — aparecem após primeira mensagem */}
        {hasMessages && (
          <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTIONS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => onSend(label)}
                disabled={loading}
                className="shrink-0 inline-flex items-center gap-1 rounded-full border border-hotel-gold/25 bg-background px-2.5 py-1 text-[10px] text-muted-foreground hover:border-hotel-gold/50 hover:text-foreground hover:bg-hotel-gold/5 transition-colors disabled:opacity-40"
              >
                <Icon className="h-2.5 w-2.5 text-hotel-gold/60" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Limpar conversa */}
        {hasMessages && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Limpar conversa
          </button>
        )}

        {/* Input */}
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
