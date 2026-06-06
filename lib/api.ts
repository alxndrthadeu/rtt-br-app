import axios from 'axios';
import type {
  Game,
  Draft,
  Match,
  Ranking,
  Player,
  CreateDraftPayload,
  CreateMatchPayload,
  CreateRankingPayload,
} from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

// Game
export const createGame = (data: { player_uuid: string; formation: string }) =>
  api.post<Game>('/game', data).then((r) => r.data);

export interface PlaySeasonResult {
  schedule: import('@/types').ScheduledMatch[];
  matches: Array<{
    game_id: string; rodada: number;
    opp_team: string; opp_era: string; opp_ovr: number; is_home: boolean;
    my_goals: number; opp_goals: number; result: string;
  }>;
  pts: number; v: number; e: number; d: number; gf: number; gc: number;
}

export const playSeason = (gameId: string, data: { attack_ovr: number; def_ovr: number }) =>
  api.post<PlaySeasonResult>(`/game/${gameId}/play`, data).then((r) => r.data);

export const getGame = (id: string) =>
  api.get<Game>(`/game/${id}`).then((r) => r.data);

export const getPlayerGames = (uuid: string) =>
  api.get<Game[]>(`/game/player/${uuid}`).then((r) => r.data);

export const updateGame = (id: string, data: Partial<Game>) =>
  api.patch<Game>(`/game/${id}`, data).then((r) => r.data);

// Draft
export const saveDraft = (data: CreateDraftPayload) =>
  api.post('/draft', data).then((r) => r.data);

export const getDraft = (gameId: string) =>
  api.get<Draft[]>(`/draft/${gameId}`).then((r) => r.data);

// Match
export const saveMatch = (data: CreateMatchPayload) =>
  api.post<Match>('/match', data).then((r) => r.data);

export const getGameMatches = (gameId: string) =>
  api.get<Match[]>(`/match/game/${gameId}`).then((r) => r.data);

// Ranking
export const saveRanking = (data: CreateRankingPayload) =>
  api.post<Ranking>('/ranking', data).then((r) => r.data);

export const getPlayerRankings = (uuid: string) =>
  api.get<Ranking[]>(`/ranking/player/${uuid}`).then((r) => r.data);

// Players
export const getPlayers = (params?: { era?: string; team?: string }) =>
  api.get<any[]>('/players', { params }).then((r) =>
    r.data.map((p) => ({
      ...p,
      team: typeof p.team === 'object' && p.team !== null ? p.team.name : p.team,
      era: typeof p.era === 'object' && p.era !== null ? p.era.name : p.era,
    })) as Player[],
  );
