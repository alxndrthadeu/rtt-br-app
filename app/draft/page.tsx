'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlayers, createGame, saveDraft, playSeason } from '@/lib/api';
import {
  FORMATIONS,
  buildEmptySlots,
  calculateTeamOverall,
  calculateTeamStats,
} from '@/lib/draft';
import type { DraftSlot, Player, GameState, Squad } from '@/types';
import FootballField from '@/components/FootballField';
import TeamShield from '@/components/TeamShield';
import { getAbrev } from '@/lib/escudos';
import { usePlayerUUID } from '@/hooks/usePlayerUUID';

const GAME_STATE_KEY = 'rtt_game_state';
const MAX_REROLLS = 3;
const ATTACK_POSITIONS = new Set(['CA', 'PE', 'PD', 'MEI']);

function canPlayPosition(player: Player, pos: string): boolean {
  return (
    player.pos_principal === pos ||
    player.pos_sec1 === pos ||
    player.pos_sec2 === pos
  );
}

function getCompatibleSlots(player: Player, slots: DraftSlot[]): number[] {
  return slots
    .map((s, i) => ({ ...s, i }))
    .filter((s) => s.player === null && canPlayPosition(player, s.slot_pos))
    .map((s) => s.i);
}

function rollAnySquad(
  players: Player[],
  slots: DraftSlot[],
  excludeKey?: string,
): { squad: Squad | null; squadPlayers: Player[] } {
  const emptyPositions = new Set(
    slots.filter((s) => s.player === null).map((s) => s.slot_pos),
  );
  const usedIds = new Set(slots.filter((s) => s.player).map((s) => s.player!.id));

  const eligibleKeys = Array.from(
    new Set(
      players
        .filter(
          (p) =>
            !usedIds.has(p.id) &&
            Array.from(emptyPositions).some((pos) => canPlayPosition(p, pos)),
        )
        .map((p) => `${p.team}|||${p.era}`),
    ),
  ).filter((k) => k !== excludeKey);

  if (eligibleKeys.length === 0) return { squad: null, squadPlayers: [] };

  const key = eligibleKeys[Math.floor(Math.random() * eligibleKeys.length)];
  const [team, era] = key.split('|||');

  const squadPlayers = players
    .filter((p) => p.team === team && p.era === era && !usedIds.has(p.id))
    .sort((a, b) => b.overall - a.overall);

  return { squad: { team, era }, squadPlayers };
}

function DraftContent() {
  const router = useRouter();
  const params = useSearchParams();
  const difficulty = (params.get('difficulty') ?? 'classico') as 'classico' | 'almanaque';
  const formationParam = params.get('formation') ?? '4-4-2';
  const validFormation = formationParam in FORMATIONS ? formationParam : '4-4-2';

  const playerUUID = usePlayerUUID();
  const [formation] = useState(validFormation);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [slots, setSlots] = useState<DraftSlot[]>(() => buildEmptySlots(validFormation));
  const [rolledSquad, setRolledSquad] = useState<Squad | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [compatibleSlots, setCompatibleSlots] = useState<number[]>([]);
  const [rerollsLeft, setRerollsLeft] = useState(MAX_REROLLS);
  const [lastRolledKey, setLastRolledKey] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [showBoxScore, setShowBoxScore] = useState(false);

  const filledCount = slots.filter((s) => s.player).length;
  const allFilled = filledCount === 11;
  const teamOverall = calculateTeamOverall(slots);
  const currentSlotIndex = slots.findIndex((s) => s.player === null);
  const roundLabel = allFilled ? 'Completo' : `${filledCount}/11`;

  useEffect(() => {
    getPlayers().then(setAllPlayers);
  }, []);

  function resetSquad() {
    setRolledSquad(null);
    setSquadPlayers([]);
    setSelectedPlayer(null);
    setCompatibleSlots([]);
    setLastRolledKey(undefined);
    setPickError(null);
  }

  function doRoll(excludeKey?: string) {
    if (allPlayers.length === 0) return;
    setPickError(null);
    setSelectedPlayer(null);
    setCompatibleSlots([]);
    const { squad, squadPlayers: sp } = rollAnySquad(allPlayers, slots, excludeKey);
    if (!squad) {
      setPickError('Sem equipes disponíveis com jogadores para as posições restantes.');
      return;
    }
    const key = `${squad.team}|||${squad.era}`;
    setLastRolledKey(key);
    setRolledSquad(squad);
    setSquadPlayers(sp);
  }

  function handleRoll() {
    doRoll(undefined);
  }

  function handleReroll() {
    if (rerollsLeft <= 0) return;
    setRerollsLeft((n) => n - 1);
    doRoll(lastRolledKey);
  }

  function handlePickPlayer(player: Player) {
    setPickError(null);
    const compatible = getCompatibleSlots(player, slots);
    if (compatible.length === 0) {
      setPickError(`${player.name} não tem posição disponível no time atual.`);
      return;
    }
    setSelectedPlayer(player);
    setCompatibleSlots(compatible);
  }

  function handleSlotClick(slotIndex: number) {
    if (!selectedPlayer) return;
    setSlots((prev) =>
      prev.map((s, i) => (i === slotIndex ? { ...s, player: selectedPlayer } : s)),
    );
    resetSquad();
  }

  function handleCancelSelection() {
    setSelectedPlayer(null);
    setCompatibleSlots([]);
    setPickError(null);
  }

  async function handleConfirm() {
    if (!playerUUID || !allFilled) return;
    setSaving(true);
    try {
      const game = await createGame({ player_uuid: playerUUID, formation });
      await saveDraft({
        game_id: game.id,
        players: slots.map((s) => ({
          player_id: s.player!.id,
          slot_pos: s.slot_pos,
          slot_index: s.slot_index,
        })),
      });
      const { overall, attackOvr, defOvr } = calculateTeamStats(slots);
      const season = await playSeason(game.id, { attack_ovr: attackOvr, def_ovr: defOvr });
      const gameState: GameState = {
        gameId: game.id,
        playerUUID,
        formation,
        rerollsUsed: MAX_REROLLS - rerollsLeft,
        currentRound: season.matches.length,
        pts: season.pts,
        v: season.v,
        e: season.e,
        d: season.d,
        gf: season.gf,
        gc: season.gc,
        teamOverall: overall,
        attackOvr,
        defOvr,
        schedule: season.schedule,
        matches: season.matches.map(m => ({
          rodada:    m.rodada,
          opp_team:  m.opp_team,
          opp_era:   m.opp_era,
          opp_ovr:   m.opp_ovr,
          isHome:    m.is_home,
          my_goals:  m.my_goals,
          opp_goals: m.opp_goals,
          result:    m.result as 'V' | 'E' | 'D',
        })),
      };
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
      router.push('/campeonato');
    } finally {
      setSaving(false);
    }
  }

  /* ─── shared squad header (desktop panel + mobile sheet) ─── */
  const squadHeader = rolledSquad && (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-ink/12 dark:border-gold/10 shrink-0">
      <TeamShield team={rolledSquad.team} size={30} className="shrink-0 drop-shadow" />
      <div className="flex-1 min-w-0">
        <div className="text-base font-black text-ink dark:text-cream tracking-widest leading-none">
          {getAbrev(rolledSquad.team)}
        </div>
        <div className="text-[9px] text-ink/50 dark:text-cream/30 uppercase tracking-[0.3em] mt-0.5">
          Era {rolledSquad.era}
        </div>
      </div>
      <button
        onClick={handleReroll}
        disabled={rerollsLeft <= 0}
        title={`${rerollsLeft} reroll${rerollsLeft !== 1 ? 's' : ''} restante${rerollsLeft !== 1 ? 's' : ''}`}
        className="flex flex-col items-center justify-center gap-0.5 w-10 h-10 border border-ink/20 dark:border-gold/30 hover:border-gold hover:text-ink dark:hover:text-cream disabled:opacity-25 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        <span className="text-sm font-bold text-ink/70 dark:text-cream/50 leading-none">↺</span>
        <span className="text-[8px] font-black text-ink/50 dark:text-cream/30 leading-none">{rerollsLeft}</span>
      </button>
    </div>
  );

  /* ─── shared player list / slot picker (desktop panel + mobile sheet) ─── */
  const playerSelectionContent = rolledSquad && (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      {selectedPlayer ? (
        <div className="p-4">
          <div className="relative border-2 border-coral bg-coral/[0.07] p-3 mb-4">
            <div className="absolute inset-[3px] border border-coral/30 pointer-events-none" />
            <p className="text-[9px] tracking-[0.3em] uppercase text-coral mb-1 font-bold">Selecionado</p>
            <p className="font-black text-base leading-tight text-ink dark:text-cream uppercase">
              {selectedPlayer.name}
            </p>
            <p className="text-[10px] text-ink/65 dark:text-cream/40 uppercase tracking-wide mt-0.5">
              {selectedPlayer.pos_principal}{selectedPlayer.pos_sec1 ? `/${selectedPlayer.pos_sec1}` : ''}
              {difficulty === 'classico' && ` · ${selectedPlayer.overall}`}
            </p>
          </div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-ink/65 dark:text-cream/35 mb-3">
            Escolha a posição no campo
          </p>
          <div className="flex flex-col gap-2">
            {compatibleSlots.map((i) => (
              <button
                key={i}
                onClick={() => handleSlotClick(i)}
                className="border-2 border-coral bg-coral/[0.07] hover:bg-coral hover:text-cream active:bg-coral active:text-cream py-3 px-4 text-[12px] font-black uppercase tracking-widest transition-colors text-left flex items-center justify-between text-ink dark:text-cream"
              >
                <span>{slots[i].slot_pos}</span>
                <span className="text-[9px] text-ink/60 dark:text-cream/40">pos. {i + 1}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleCancelSelection}
            className="w-full mt-3 text-[9px] text-ink/60 dark:text-cream/30 hover:text-ink dark:hover:text-cream/65 py-2.5 uppercase tracking-widest transition-colors"
          >
            ← Voltar
          </button>
        </div>
      ) : (
        <>
          <p className="text-[9px] tracking-[0.35em] uppercase text-ink/70 dark:text-cream/30 px-4 py-3 border-b border-ink/10 dark:border-gold/10 bg-parchment dark:bg-navy sticky top-0 font-bold">
            Escolha um jogador
          </p>
          {squadPlayers.map((p, idx) => {
            const canFit = getCompatibleSlots(p, slots).length > 0;
            return (
              <button
                key={p.id}
                onClick={() => canFit && handlePickPlayer(p)}
                disabled={!canFit}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-ink/8 dark:border-gold/8 text-left transition-colors ${
                  canFit
                    ? 'hover:bg-paper dark:hover:bg-midnight active:bg-paper/80 dark:active:bg-midnight/80 cursor-pointer'
                    : 'opacity-30 cursor-not-allowed'
                }`}
              >
                <span className="text-ink/45 dark:text-cream/25 text-[10px] w-6 shrink-0 font-bold">
                  #{idx + 1}
                </span>
                <span className="flex-1 font-bold text-sm leading-tight text-ink dark:text-cream uppercase">
                  {p.name}
                </span>
                <span className="text-[9px] text-ink/60 dark:text-cream/35 uppercase tracking-wide shrink-0">
                  {p.pos_principal}{p.pos_sec1 ? `/${p.pos_sec1}` : ''}
                </span>
                {difficulty === 'classico' && (
                  <span className="text-lg font-black ml-1 shrink-0 text-gold">{p.overall}</span>
                )}
              </button>
            );
          })}
        </>
      )}
    </div>
  );

  /* ─── box score (desktop right col + mobile Elenco modal) ─── */
  const boxScoreContent = (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gold/50 dark:bg-gold/30" />
        <p className="text-[9px] tracking-[0.45em] uppercase text-gold font-bold shrink-0">
          Escalação · {filledCount}/11
        </p>
        <div className="flex-1 h-px bg-gold/50 dark:bg-gold/30" />
      </div>
      <div className="flex gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-ink/65 dark:text-cream/40 font-bold">
          <span className="w-2.5 h-0.5 bg-coral inline-block" />
          Ataque
        </span>
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-ink/65 dark:text-cream/40 font-bold">
          <span className="w-2.5 h-0.5 bg-ink/40 dark:bg-cream/30 inline-block" />
          Defesa
        </span>
      </div>
      <div className="flex flex-col divide-y divide-ink/8 dark:divide-gold/10">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2 py-2.5">
            <span className={`text-[10px] font-black uppercase tracking-wide w-9 shrink-0 ${
              ATTACK_POSITIONS.has(slot.slot_pos) ? 'text-coral' : 'text-ink/55 dark:text-cream/40'
            }`}>
              {slot.slot_pos}
            </span>
            {slot.player ? (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="min-w-0 flex items-center gap-1.5">
                  <TeamShield team={slot.player.team} size={16} className="shrink-0 opacity-90" />
                  <div className="min-w-0">
                    <div className="text-sm font-black truncate leading-tight text-ink dark:text-cream uppercase">
                      {slot.player.name.split(' ').slice(-1)[0]}
                    </div>
                    <div className="text-[8px] text-ink/55 dark:text-cream/25 uppercase tracking-wide truncate">
                      {getAbrev(slot.player.team)} · {slot.player.era}
                    </div>
                  </div>
                </div>
                {difficulty === 'classico' && (
                  <span className="text-sm font-black text-gold ml-2 shrink-0">
                    {slot.player.overall}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-ink/20 dark:text-cream/15 text-sm font-bold">—</span>
            )}
          </div>
        ))}
      </div>
      {allFilled && (
        <div className="mt-5 pt-4 border-t-2 border-gold/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-px bg-gold/50" />
            <span className="text-[8px] uppercase tracking-widest text-gold font-bold">Overall</span>
            <div className="flex-1 h-px bg-gold/50" />
          </div>
          <p className="text-4xl font-black text-gold text-center">{teamOverall}</p>
        </div>
      )}
    </>
  );

  /* ─── shared CTA buttons ─── */
  const ctaRolar = (
    <div className="relative">
      <div className="absolute -inset-1 border border-gold/40" />
      <button
        onClick={handleRoll}
        disabled={allPlayers.length === 0}
        className="relative w-full bg-gold text-midnight font-black text-lg uppercase tracking-[0.2em] py-4 disabled:opacity-40 hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] active:scale-[0.99] transition-all duration-200 border-2 border-gold shadow-[inset_0_0_0_1px_rgba(201,168,76,0.4)]"
      >
        ROLAR ◆
      </button>
    </div>
  );

  const ctaConfirmar = (
    <div className="relative">
      <div className="absolute -inset-1 border border-green/40" />
      <button
        onClick={handleConfirm}
        disabled={saving || !playerUUID}
        className="relative w-full bg-green text-cream font-black text-lg uppercase tracking-[0.2em] py-4 hover:bg-green/90 hover:shadow-[0_0_24px_rgba(27,107,58,0.5)] disabled:opacity-40 active:scale-[0.99] transition-all duration-200 border-2 border-green"
      >
        {saving ? 'Salvando...' : 'CONFIRMAR ◆'}
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-paper dark:bg-midnight flex flex-col transition-colors relative z-10 overflow-hidden">

      {/* ── Header ── */}
      <header className="border-b border-ink/15 dark:border-gold/15 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Alcance o Topo" className="h-8 object-contain" />
          <div className="w-px h-5 bg-ink/20 dark:bg-gold/30" />
          <span className="text-[9px] tracking-[0.4em] uppercase text-ink/65 dark:text-cream/35 group-hover:text-ink dark:group-hover:text-cream/70 transition-colors font-bold">
            Draft
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="border-2 border-gold px-3 py-1 text-[10px] font-black uppercase tracking-widest text-ink dark:text-cream">
            {roundLabel}
          </div>
          <button
            onClick={() => setShowBoxScore(true)}
            className="md:hidden border border-ink/25 dark:border-gold/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink/65 dark:text-cream/40 hover:border-gold hover:text-ink dark:hover:text-cream transition-colors"
          >
            Elenco
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-7 h-7 border border-ink/25 dark:border-gold/40 flex items-center justify-center text-ink/65 dark:text-cream/40 hover:text-ink dark:hover:text-cream hover:border-ink dark:hover:border-gold transition-colors text-xs font-bold"
            title="Reiniciar"
          >
            ↺
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* ── FIELD ──
            Mobile: fills entire body (order-1), field floats at top so attacking area is visible above the sheet
            Desktop: center column (order-2), original sizing
        ── */}
        <div className="order-1 md:order-2 flex-1 md:flex-none md:flex-1 flex items-start justify-center bg-paper/50 dark:bg-midnight md:p-0 md:items-center">

          {/* Mobile: edge-to-edge, top-anchored — attacking area stays visible above the sheet */}
          <div className="md:hidden w-full">
            <div style={{ width: '100%', aspectRatio: '200/280' }}>
              <FootballField
                formation={formation}
                slots={slots}
                currentSlotIndex={currentSlotIndex}
                difficulty={difficulty}
                compatibleSlots={compatibleSlots}
                onSlotClick={handleSlotClick}
              />
            </div>
          </div>

          {/* Desktop: original bordered field */}
          <div className="hidden md:flex flex-col items-center gap-3 p-8">
            <div className="relative p-2">
              <div className="absolute inset-0 border border-ink/20 dark:border-gold/20 pointer-events-none" />
              <div
                className="overflow-hidden"
                style={{ height: 'min(590px, calc(100vh - 150px))', aspectRatio: '200/280' }}
              >
                <FootballField
                  formation={formation}
                  slots={slots}
                  currentSlotIndex={currentSlotIndex}
                  difficulty={difficulty}
                  compatibleSlots={compatibleSlots}
                  onSlotClick={handleSlotClick}
                />
              </div>
            </div>
            <div className="border border-ink/30 dark:border-gold/40 px-4 py-1 text-[10px] font-black text-ink/70 dark:text-cream/40 tracking-widest uppercase">
              {formation}
            </div>
          </div>
        </div>

        {/* ── DESKTOP action panel (left col, hidden on mobile) ── */}
        <div className="hidden md:flex md:order-1 md:w-[300px] md:shrink-0 border-r border-ink/15 dark:border-gold/10 flex-col overflow-hidden bg-parchment dark:bg-navy">
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {rolledSquad ? (
              <>
                {squadHeader}
                {playerSelectionContent}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
                {pickError && (
                  <div className="w-full border border-coral/60 bg-coral/[0.08] p-3 text-sm text-coral font-bold uppercase tracking-wide">
                    {pickError}
                  </div>
                )}
                <p className="text-[11px] text-ink/50 dark:text-cream/25 text-center uppercase tracking-[0.2em]">
                  {allFilled
                    ? 'Time completo! Confirme a escalação.'
                    : filledCount > 0
                    ? `${filledCount} / 11 — role para continuar`
                    : 'Role para sortear um clube'}
                </p>
              </div>
            )}
          </div>
          {(allFilled || !rolledSquad) && (
            <div className="p-4 border-t border-ink/15 dark:border-gold/10 shrink-0">
              {allFilled ? ctaConfirmar : ctaRolar}
            </div>
          )}
        </div>

        {/* ── DESKTOP box score (right col, hidden on mobile) ── */}
        <div className="hidden md:block md:order-3 md:w-[260px] md:shrink-0 border-l border-ink/15 dark:border-gold/10 p-5 overflow-y-auto bg-parchment dark:bg-navy">
          {boxScoreContent}
        </div>

      </div>

      {/* ════════════════════════════════════════
          MOBILE-ONLY overlays (position: fixed,
          independent scroll context)
      ════════════════════════════════════════ */}

      {/* Mobile CTA — always in DOM, opacity transition eliminates flicker.
          Hidden (opacity-0) while squad sheet is open. */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 z-20 px-4 py-4 bg-paper/95 dark:bg-midnight/95 border-t border-ink/15 dark:border-gold/10 transition-opacity duration-200 ${rolledSquad && !allFilled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {pickError && !rolledSquad && (
          <div className="mb-3 border border-coral/60 bg-coral/[0.08] p-2.5 text-sm text-coral font-bold uppercase tracking-wide">
            {pickError}
          </div>
        )}
        {allFilled ? ctaConfirmar : ctaRolar}
      </div>

      {/* Mobile bottom sheet — always in DOM, translateY transition for smooth slide.
          Starts below viewport (translate-y-full), slides up when squad is active. */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-30 flex flex-col bg-parchment dark:bg-navy rounded-t-2xl border-t-2 border-gold/30 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${rolledSquad && !allFilled ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ top: '52vh' }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-ink/15 dark:bg-cream/15" />
        </div>

        {squadHeader}
        {playerSelectionContent}
      </div>

      {/* Mobile: Elenco box score modal */}
      {showBoxScore && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-midnight/70 flex items-end"
          onClick={() => setShowBoxScore(false)}
        >
          <div
            className="w-full bg-parchment dark:bg-navy rounded-t-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-ink/15 dark:border-gold/15 sticky top-0 bg-parchment dark:bg-navy">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Escalação</span>
              <button
                onClick={() => setShowBoxScore(false)}
                className="text-ink/60 dark:text-cream/40 text-xl font-bold leading-none hover:text-ink dark:hover:text-cream transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              {boxScoreContent}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense>
      <DraftContent />
    </Suspense>
  );
}
