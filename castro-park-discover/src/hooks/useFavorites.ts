import { useState, useEffect } from "react";

const STORAGE_KEY = "castro_favorites";

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage unavailable — silently ignore
    }
  }, [favorites]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggle = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return { favorites, isFavorite, toggle };
}
