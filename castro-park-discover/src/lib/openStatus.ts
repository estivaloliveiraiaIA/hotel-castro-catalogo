/**
 * openStatus.ts
 * Calcula em tempo real se um lugar está aberto agora,
 * baseado no array `hours[]` do lugar.
 *
 * Formato esperado dos horários:
 *   "Segunda: 9:00 - 18:00"
 *   "Terça: Fechado"
 *   "Sábado: Open 24 hours"
 *   "Domingo: 00:00 - 00:00"  (meia-noite a meia-noite = 24h)
 */

const DAY_INDEX: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terça: 2,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6,
  sabado: 6,
  // fallback inglês (pode vir do Apify)
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Retorna o objeto Date atual no fuso de Brasília (UTC-3). */
function nowInBrasilia(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
}

/** Converte "HH:MM" em minutos desde meia-noite. */
function timeToMinutes(t: string): number {
  const [h, m] = t.trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export type OpenStatusResult = {
  isOpen: boolean;
  label: string; // "Aberto agora" | "Fechado" | "Aberto 24h" | null
  opensAt?: string; // ex: "09:00" — quando abre hoje ou amanhã
  closesAt?: string; // ex: "22:00" — quando fecha hoje
};

/**
 * Determina se um lugar está aberto agora baseado nos horários.
 * Retorna null se não houver horários disponíveis.
 */
export function computeOpenStatus(hours: string[] | undefined | null): OpenStatusResult | null {
  if (!hours || hours.length === 0) return null;

  const now = nowInBrasilia();
  const todayIndex = now.getDay(); // 0=dom, 1=seg ... 6=sab
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Tenta encontrar a entrada do dia atual no array de horários
  for (const entry of hours) {
    const colonIdx = entry.indexOf(":");
    if (colonIdx === -1) continue;

    const dayRaw = entry.slice(0, colonIdx).trim().toLowerCase();
    const hoursRaw = entry.slice(colonIdx + 1).trim().toLowerCase();

    const dayIdx = DAY_INDEX[dayRaw];
    if (dayIdx !== todayIndex) continue;

    // Fechado explícito
    if (hoursRaw.includes("fechado") || hoursRaw.includes("closed")) {
      return { isOpen: false, label: "Fechado hoje" };
    }

    // Aberto 24h
    if (
      hoursRaw.includes("24 hour") ||
      hoursRaw.includes("24h") ||
      hoursRaw.includes("aberto 24") ||
      hoursRaw === "00:00 - 00:00"
    ) {
      return { isOpen: true, label: "Aberto 24h", closesAt: undefined };
    }

    // Formato "HH:MM - HH:MM" (pode ter múltiplos intervalos separados por vírgula)
    const intervals = hoursRaw.split(",").map((s) => s.trim());
    for (const interval of intervals) {
      const match = interval.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      if (!match) continue;

      const openMin = timeToMinutes(match[1]);
      let closeMin = timeToMinutes(match[2]);

      // "00:00" como fechamento = meia-noite = 24*60
      if (closeMin === 0) closeMin = 24 * 60;

      // Cruzamento de meia-noite: ex 22:00 - 02:00
      const crossesMidnight = closeMin < openMin;

      const isOpen = crossesMidnight
        ? currentMinutes >= openMin || currentMinutes < closeMin
        : currentMinutes >= openMin && currentMinutes < closeMin;

      if (isOpen) {
        const closeHHMM = `${String(Math.floor(closeMin / 60) % 24).padStart(2, "0")}:${String(closeMin % 60).padStart(2, "0")}`;
        return { isOpen: true, label: "Aberto agora", closesAt: closeHHMM };
      }

      // Vai abrir mais tarde hoje
      if (currentMinutes < openMin) {
        const openHHMM = `${String(Math.floor(openMin / 60)).padStart(2, "0")}:${String(openMin % 60).padStart(2, "0")}`;
        return { isOpen: false, label: `Abre às ${openHHMM}`, opensAt: openHHMM };
      }
    }

    // Encontrou o dia mas passou do horário
    return { isOpen: false, label: "Fechado agora" };
  }

  // Dia não encontrado nos horários
  return null;
}
