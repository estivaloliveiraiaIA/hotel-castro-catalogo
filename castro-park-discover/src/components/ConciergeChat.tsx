import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConciergeChatProps {
  onOpenChat: () => void;
}

export const ConciergeChat = ({ onOpenChat }: ConciergeChatProps) => {
  return (
    <section className="border-b bg-gradient-to-b from-primary/12 to-background py-10 md:py-14">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-hotel-gold/15 border border-hotel-gold/35 px-4 py-1.5 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-hotel-gold" />
            <span className="text-xs font-medium text-hotel-gold tracking-wider uppercase">Concierge Digital · IA</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl mb-3 leading-tight">
            Seu concierge pessoal<br className="hidden sm:block" /> em Goiânia
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed mb-6">
            Diga o que procura em suas palavras — nossa IA encontra os melhores lugares entre mais de 500 opções curadas para você
          </p>
          <Button
            onClick={onOpenChat}
            size="lg"
            className="rounded-full px-8 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Falar com o Concierge
          </Button>
        </div>
      </div>
    </section>
  );
};
