import { useState, useCallback, useRef } from "react";

export interface ConciergePlace {
  id: string;
  name: string;
  reason: string;
  highlight: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  places?: ConciergePlace[];
  timestamp: number;
}

export function useConciergeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Keep messages in ref so the callback always has latest value
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const nextMessages = [...messagesRef.current, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar o concierge");

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message || "",
        places: data.places || [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("[useConciergeChat] error:", err);
      setError("O concierge não está disponível agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    isOpen,
    open,
    close,
    sendMessage,
    clearConversation,
  };
}
