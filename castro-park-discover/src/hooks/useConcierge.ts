import { useState, useCallback } from "react";

export interface ConciergePlace {
  id: string;
  name: string;
  reason: string;
  highlight: string;
}

export interface ConciergeResult {
  message: string;
  places: ConciergePlace[];
}

export function useConcierge() {
  const [result, setResult] = useState<ConciergeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar o concierge");
      setResult(data);
    } catch {
      setError("O concierge não está disponível agora. Explore os lugares pelo menu abaixo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { search, clear, result, loading, error };
}
