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

function classifyError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.message.includes("timeout")) {
      return "Demorei mais que o esperado. Por favor, tente novamente em instantes.";
    }
    if (
      err.message === "Failed to fetch" ||
      err.message.includes("NetworkError") ||
      err.message.includes("network")
    ) {
      return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";
    }
  }
  return "O concierge não está disponível agora. Tente novamente em instantes.";
}

export type ConciergeLanguage = "pt" | "en" | "es";

export function useConciergeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<ConciergeLanguage | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setLanguage(null);
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
          language,
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
      setError(classifyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    isOpen,
    language,
    setLanguage,
    open,
    close,
    sendMessage,
    clearConversation,
  };
}
