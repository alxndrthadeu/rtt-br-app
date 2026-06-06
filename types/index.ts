export interface Player {
  id: string;
  name: string;
  team: string;
  era: string;
  overall: number;
  pos_principal: string;
  pos_sec1: string | null;
  pos_sec2: string | null;
  estilo: string;
}

export interface Squad {
  team: string;
  era: string;
}

export interface Opponent {
  team: string;
  era: string;
  atkOvr: number;
  defOvr: number;
}

export interface ScheduledMatch {
  round: number;
  opponent: Opponent;
  isHome: boolean;
}

export interface Game {
  id: string;
  player_uuid: string;
  formation: string;
  rerolls_used: number;
  schedule: ScheduledMatch[] | null;
  ranking: string | null;
  pts: number | null;
  v: number | null;
  e: number | null;
  d: number | null;
  gf: number | null;
  gc: number | null;
  created_at: string;
}

export interface Draft {
  id: string;
  game_id: string;
  player_id: string;
  slot_pos: string;
  slot_index: number;
  player?: Player;
}

export interface Match {
  id: string;
  game_id: string;
  rodada: number;
  opp_team: string;
  opp_era: string;
  opp_ovr: number;
  my_goals: number;
  opp_goals: number;
  result: string;
}

export interface Ranking {
  id: string;
  game_id: string;
  rank: string;
  destaque_player_id: string;
  destaque_overall: number;
  created_at: string;
  destaque_player?: Player;
  game?: Game;
}

export interface DraftSlot {
  slot_pos: string;
  slot_index: number;
  player: Player | null;
}

export interface GameState {
  gameId: string;
  playerUUID: string;
  formation: string;
  rerollsUsed: number;
  currentRound: number;
  pts: number;
  v: number;
  e: number;
  d: number;
  gf: number;
  gc: number;
  teamOverall: number;
  attackOvr: number;
  defOvr: number;
  schedule: ScheduledMatch[];
  matches: LocalMatch[];
}

export interface LocalMatch {
  rodada: number;
  opp_team: string;
  opp_era: string;
  opp_ovr: number;
  isHome: boolean;
  my_goals: number;
  opp_goals: number;
  result: 'V' | 'E' | 'D';
}

export interface CreateDraftPayload {
  game_id: string;
  players: Array<{
    player_id: string;
    slot_pos: string;
    slot_index: number;
  }>;
}

export interface CreateMatchPayload {
  game_id: string;
  rodada: number;
  opp_team: string;
  opp_era: string;
  opp_ovr: number;
  my_goals: number;
  opp_goals: number;
  result: string;
}

export interface CreateRankingPayload {
  game_id: string;
  rank: string;
  destaque_player_id: string;
  destaque_overall: number;
  pts: number;
  v: number;
  e: number;
  d: number;
  gf: number;
  gc: number;
}
