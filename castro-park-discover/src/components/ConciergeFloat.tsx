import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConciergeChatPanel } from "@/components/ConciergeChatPanel";
import { useConciergeChat } from "@/hooks/useConciergeChat";

export const CONCIERGE_OPEN_EVENT = "concierge:open";

export function ConciergeFloat() {
  const { messages, loading, error, isOpen, open, close, sendMessage, clearConversation } =
    useConciergeChat();
  const { t } = useTranslation();

  // Allow any page to trigger open via custom DOM event
  useEffect(() => {
    const handler = () => open();
    window.addEventListener(CONCIERGE_OPEN_EVENT, handler);
    return () => window.removeEventListener(CONCIERGE_OPEN_EVENT, handler);
  }, [open]);

  const handleOpen = () => open();
  const handleClose = () => close();
  const sheetOpen = isOpen;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="hidden md:flex fixed md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full bg-hotel-gold shadow-lg hover:bg-hotel-gold/90 active:scale-95 transition-all items-center justify-center"
        aria-label={t("concierge.openAriaLabel")}
      >
        <Sparkles className="h-6 w-6 text-hotel-charcoal" />
        {messages.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
        )}
      </button>

      {/* Sheet panel */}
      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? handleOpen() : handleClose())}>
        <SheetContent
          side="right"
          className="w-full sm:w-[380px] p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <span className="text-lg">👩‍💼</span>
                <div className="flex flex-col">
                  <span className="font-serif text-base leading-tight">{t("concierge.title")}</span>
                  <span className="text-[10px] text-hotel-gold/70 font-normal tracking-wide leading-tight">Concierge Digital · Castro's Park</span>
                </div>
              </SheetTitle>
              <button
                onClick={handleClose}
                className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                aria-label={t("concierge.closeAriaLabel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ConciergeChatPanel
              messages={messages}
              loading={loading}
              error={error}
              onSend={sendMessage}
              onClear={clearConversation}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
