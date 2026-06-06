import type { Player, DraftSlot, Squad } from '@/types';

export const FORMATIONS: Record<string, string[]> = {
  '4-4-2':   ['GK', 'ZAG', 'ZAG', 'LD', 'LE', 'MEI', 'MEI', 'MEI', 'MEI', 'CA', 'CA'],
  '4-3-3':   ['GK', 'ZAG', 'ZAG', 'LD', 'LE', 'MEI', 'MEI', 'MEI', 'PE', 'PD', 'CA'],
  '3-5-2':   ['GK', 'ZAG', 'ZAG', 'ZAG', 'LD', 'LE', 'MEI', 'MEI', 'MEI', 'CA', 'CA'],
  '4-2-3-1': ['GK', 'ZAG', 'ZAG', 'LD', 'LE', 'MEI', 'MEI', 'MEI', 'PE', 'PD', 'CA'],
};

function canPlayPosition(player: Player, pos: string): boolean {
  return (
    player.pos_principal === pos ||
    player.pos_sec1 === pos ||
    player.pos_sec2 === pos
  );
}

export function rollSquadForPosition(
  players: Player[],
  pos: string,
  usedIds: Set<string>,
): { squad: Squad | null; candidates: Player[] } {
  const eligible = players.filter(
    (p) => !usedIds.has(p.id) && canPlayPosition(p, pos),
  );
  if (eligible.length === 0) return { squad: null, candidates: [] };

  const squads = Array.from(new Set(eligible.map((p) => `${p.team}|||${p.era}`)));
  const key = squads[Math.floor(Math.random() * squads.length)];
  const [team, era] = key.split('|||');
  const candidates = eligible.filter((p) => p.team === team && p.era === era);
  return { squad: { team, era }, candidates };
}

export function buildEmptySlots(formation: string): DraftSlot[] {
  return (FORMATIONS[formation] ?? FORMATIONS['4-4-2']).map((pos, i) => ({
    slot_pos: pos,
    slot_index: i,
    player: null,
  }));
}

// Posições que contribuem para cada linha
const ATTACK_ROLES = new Set(['CA', 'PE', 'PD', 'MEI']);
const DEFENSE_ROLES = new Set(['GK', 'ZAG', 'LD', 'LE', 'MEI']);

// Bônus de overall somado antes de calcular a média — torna o time mais forte
const TRAIT_ATK: Record<string, number> = { matador: 3, camisa10: 3, liso: 2 };
const TRAIT_DEF: Record<string, number> = { xerife: 3, paredao: 4, liso: 1 };

export function calculateTeamOverall(slots: DraftSlot[]): number {
  const valid = slots.filter((s): s is DraftSlot & { player: Player } => s.player !== null);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((sum, s) => sum + s.player.overall, 0) / valid.length);
}

export function calculateTeamStats(slots: DraftSlot[]): {
  overall: number;
  attackOvr: number;
  defOvr: number;
} {
  const filled = slots.filter((s): s is DraftSlot & { player: Player } => s.player !== null);
  if (filled.length === 0) return { overall: 0, attackOvr: 0, defOvr: 0 };

  const atkGroup = filled.filter(s => ATTACK_ROLES.has(s.slot_pos));
  const defGroup = filled.filter(s => DEFENSE_ROLES.has(s.slot_pos));

  const groupOvr = (group: typeof filled, bonusMap: Record<string, number>) => {
    if (!group.length) return 0;
    const total = group.reduce((sum, s) => sum + s.player.overall + (bonusMap[s.player.trait ?? ''] ?? 0), 0);
    return Math.round(total / group.length);
  };

  return {
    overall:   Math.round(filled.reduce((s, x) => s + x.player.overall, 0) / filled.length),
    attackOvr: groupOvr(atkGroup, TRAIT_ATK),
    defOvr:    groupOvr(defGroup, TRAIT_DEF),
  };
}
