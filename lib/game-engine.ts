// Lógica de simulação movida para a API.
// Este arquivo mantém apenas utilitários que rodam no cliente.

export function getPoints(result: 'V' | 'E' | 'D'): number {
  return result === 'V' ? 3 : result === 'E' ? 1 : 0;
}

// Ranking baseado no histórico real do Brasileirão (2006–2024).
// Ver docs/ranking-rules.md para referências completas.
export function calculateRanking(pts: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (pts >= 78) return 'S';
  if (pts >= 67) return 'A';
  if (pts >= 54) return 'B';
  if (pts >= 46) return 'C';
  return 'D';
}

export const RANK_LABELS: Record<string, string> = {
  S: 'Campeão Histórico',
  A: 'Campeão',
  B: 'Libertadores',
  C: 'Sul-Americana',
  D: 'Rebaixado',
};

export const RANK_SUBTITLES: Record<string, string> = {
  S: 'Temporada lendária — entrou para os livros',
  A: 'Pontuação de título — disputou até o fim',
  B: 'Grande campanha — Libertadores garantida',
  C: 'Zona segura — sem rebaixamento, sem copa',
  D: 'Z4 — temporada para esquecer',
};
