'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getPoints } from '@/lib/game-engine';
import TeamShield from '@/components/TeamShield';
import type { GameState, LocalMatch, ScheduledMatch } from '@/types';

const GAME_STATE_KEY = 'rtt_game_state';

function VintageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gold/30" />
      <p className="text-[9px] tracking-[0.45em] uppercase text-gold/70 font-bold shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gold/30" />
    </div>
  );
}

// ─── Estado 0: pré-jogo ──────────────────────────────────────────────────────

function PreGameView({
  next,
  myAtk,
  myDef,
  myOvr,
}: {
  next: ScheduledMatch;
  myAtk: number;
  myDef: number;
  myOvr: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="text-center">
        <p className="text-[9px] tracking-[0.5em] uppercase text-gold font-bold mb-1">Primeira Partida</p>
        <p className="text-[11px] tracking-[0.3em] uppercase text-cream/30">
          Rodada 1 · {next.isHome ? 'Em Casa' : 'Fora de Casa'}
        </p>
      </div>

      {/* VS card */}
      <div className="w-full relative">
        <div className="absolute inset-0 border border-gold/30" />
        <div className="absolute inset-[3px] border border-gold/10" />
        <div className="relative p-6 grid grid-cols-3 items-center gap-4">
          {/* Seu time */}
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 mb-2">Seu Time</p>
            <p className="text-2xl font-black text-gold">{myOvr}</p>
            <p className="text-[9px] text-cream/30 mt-1 uppercase tracking-wide">OVR</p>
            <div className="flex gap-3 mt-3">
              <div>
                <p className="text-sm font-black text-coral">{myAtk}</p>
                <p className="text-[8px] uppercase tracking-wide text-cream/25">Atk</p>
              </div>
              <div>
                <p className="text-sm font-black text-green">{myDef}</p>
                <p className="text-[8px] uppercase tracking-wide text-cream/25">Def</p>
              </div>
            </div>
          </div>

          {/* VS */}
          <div className="text-center">
            <p className="text-3xl font-black text-cream/20 tracking-widest">VS</p>
          </div>

          {/* Oponente */}
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 mb-2">Adversário</p>
            <p className="text-2xl font-black text-cream">
              {Math.round((next.opponent.atkOvr + next.opponent.defOvr) / 2)}
            </p>
            <p className="text-[9px] text-cream/30 mt-1 uppercase tracking-wide">OVR</p>
            <div className="flex gap-3 justify-end mt-3">
              <div className="text-right">
                <p className="text-sm font-black text-coral">{next.opponent.atkOvr}</p>
                <p className="text-[8px] uppercase tracking-wide text-cream/25">Atk</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-green">{next.opponent.defOvr}</p>
                <p className="text-[8px] uppercase tracking-wide text-cream/25">Def</p>
              </div>
            </div>
            <TeamShield team={next.opponent.team} size={36} className="ml-auto mt-3 drop-shadow" />
          </div>
        </div>

        {/* Nome do oponente */}
        <div className="relative border-t border-cream/[0.06] px-6 py-3 text-right">
          <p className="text-base font-black uppercase tracking-wide text-cream">{next.opponent.team}</p>
          <p className="text-[10px] text-cream/35 uppercase tracking-wide mt-0.5">{next.opponent.era}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Resultado da última partida ──────────────────────────────────────────────

function LastResultCard({ match }: { match: LocalMatch }) {
  const isWin  = match.result === 'V';
  const isDraw = match.result === 'E';

  const borderOuter = isWin ? 'border-green/50' : isDraw ? 'border-gold/40' : 'border-coral/50';
  const borderInner = isWin ? 'border-green/15' : isDraw ? 'border-gold/15' : 'border-coral/15';
  const resultColor = isWin ? 'text-green' : isDraw ? 'text-gold' : 'text-coral';
  const resultLabel = isWin ? 'Vitória' : isDraw ? 'Empate' : 'Derrota';

  return (
    <div className="relative bg-navy/60">
      <div className={`absolute inset-0 border-2 ${borderOuter}`} />
      <div className={`absolute inset-[3px] border ${borderInner}`} />
      <div className="relative p-5">
        {/* Cabeçalho do card */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[9px] uppercase tracking-[0.4em] text-cream/30">Rodada {match.rodada}</p>
          <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${resultColor}`}>
            {resultLabel}
          </p>
          <p className="text-[9px] uppercase tracking-[0.3em] text-cream/25">
            {match.isHome ? 'Casa' : 'Fora'}
          </p>
        </div>

        {/* Placar */}
        <div className="grid grid-cols-3 items-center gap-3">
          <p className="text-sm font-black uppercase tracking-wide text-cream/80 text-left">Seu Time</p>
          <div className="text-center">
            <p className="text-5xl font-black tracking-tight text-cream leading-none">
              {match.my_goals}
              <span className="text-gold/50 mx-1.5">—</span>
              {match.opp_goals}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <TeamShield team={match.opp_team} size={28} className="drop-shadow" />
            <p className="text-sm font-black uppercase tracking-wide text-cream/80 truncate">
              {match.opp_team}
            </p>
            <p className="text-[9px] text-cream/30 uppercase tracking-wide">{match.opp_era}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Faixa compacta de stats ──────────────────────────────────────────────────

function StatsStrip({ pts, v, e, d, gf, gc }: { pts: number; v: number; e: number; d: number; gf: number; gc: number }) {
  const items = [
    { label: 'PTS', value: pts, bold: true },
    { label: 'V',   value: v },
    { label: 'E',   value: e },
    { label: 'D',   value: d },
    { label: 'GF',  value: gf },
    { label: 'GC',  value: gc },
  ];
  return (
    <div className="relative bg-navy/40">
      <div className="absolute inset-0 border border-cream/[0.07]" />
      <div className="relative flex divide-x divide-cream/[0.07]">
        {items.map(({ label, value, bold }) => (
          <div key={label} className="flex-1 py-3 text-center">
            <p className={`text-base font-black ${bold ? 'text-gold' : 'text-cream/80'}`}>{value}</p>
            <p className="text-[8px] uppercase tracking-[0.3em] text-cream/25 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card do próximo adversário (compacto) ────────────────────────────────────

function NextOpponentCard({ next, round }: { next: ScheduledMatch; round: number }) {
  return (
    <div className="relative bg-navy/40">
      <div className="absolute inset-0 border border-cream/[0.07]" />
      <div className="relative px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <TeamShield team={next.opponent.team} size={32} className="shrink-0 drop-shadow" />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.4em] text-cream/30 mb-1">
              Rodada {round} · {next.isHome ? 'Em Casa' : 'Fora'}
            </p>
            <p className="text-base font-black uppercase tracking-wide text-cream truncate">
              {next.opponent.team}
            </p>
            <p className="text-[10px] text-cream/35 uppercase tracking-wide mt-0.5">{next.opponent.era}</p>
          </div>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <p className="text-lg font-black text-coral">{next.opponent.atkOvr}</p>
            <p className="text-[8px] uppercase tracking-[0.25em] text-cream/25">Atk</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-green">{next.opponent.defOvr}</p>
            <p className="text-[8px] uppercase tracking-[0.25em] text-cream/25">Def</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Acordéon de histórico ────────────────────────────────────────────────────

function HistoryAccordion({ matches }: { matches: LocalMatch[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="absolute inset-0 border border-cream/[0.07]" />
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-cream/35 font-bold">
          Histórico · {matches.length} partida{matches.length !== 1 ? 's' : ''}
        </span>
        <span className="text-cream/30 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="relative border-t border-cream/[0.06] max-h-52 overflow-y-auto divide-y divide-cream/[0.05]">
          {[...matches].reverse().map((m) => (
            <div key={m.rodada} className="flex items-center gap-3 px-5 py-2.5">
              <span className="text-[10px] text-cream/20 w-5 shrink-0">{m.rodada}</span>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                m.result === 'V' ? 'bg-green/70' : m.result === 'E' ? 'bg-gold/60' : 'bg-coral/70'
              }`} />
              <TeamShield team={m.opp_team} size={16} className="shrink-0 opacity-80" />
              <span className="flex-1 text-[11px] text-cream/50 truncate uppercase tracking-wide font-bold">
                {m.opp_team}
              </span>
              <span className="text-[9px] text-cream/20 shrink-0">{m.isHome ? 'H' : 'A'}</span>
              <span className="text-[11px] font-black font-mono text-cream/60 shrink-0">
                {m.my_goals}–{m.opp_goals}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function CampeonatoPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [displayedRound, setDisplayedRound] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) { router.push('/'); return; }
    setState(JSON.parse(raw));
  }, [router]);

  if (!state) return null;

  const totalRounds = state.schedule.length;
  const finished = displayedRound >= totalRounds;

  const visibleMatches = state.matches.slice(0, displayedRound);
  const visibleStats = visibleMatches.reduce(
    (acc, m) => ({
      pts: acc.pts + getPoints(m.result),
      v:   acc.v   + (m.result === 'V' ? 1 : 0),
      e:   acc.e   + (m.result === 'E' ? 1 : 0),
      d:   acc.d   + (m.result === 'D' ? 1 : 0),
      gf:  acc.gf  + m.my_goals,
      gc:  acc.gc  + m.opp_goals,
    }),
    { pts: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0 },
  );

  const lastMatch = visibleMatches[visibleMatches.length - 1] ?? null;
  const nextScheduled = !finished ? state.schedule[displayedRound] : null;
  const isPreGame = displayedRound === 0;

  return (
    <div className="min-h-screen bg-midnight flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gold/15 shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
          <Image src="/logo.png" alt="Alcance o Topo" width={34} height={34} className="object-contain" />
          <div className="w-px h-5 bg-cream/15" />
          <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-cream/30 group-hover:text-cream/70 transition-colors">
            ← Início
          </span>
        </button>
        <div className="relative px-4 py-1 border border-gold/40">
          <div className="absolute inset-[2px] border border-gold/15" />
          <span className="relative text-[9px] tracking-[0.4em] uppercase font-black text-gold">
            {finished
              ? 'Temporada Encerrada'
              : isPreGame
              ? 'Temporada · 38 Rodadas'
              : `Rodada ${displayedRound} / ${totalRounds}`}
          </span>
        </div>
      </header>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto w-full px-6">

          {/* ── Estado 0: pré-jogo ── */}
          {isPreGame && nextScheduled && (
            <PreGameView
              next={nextScheduled}
              myAtk={state.attackOvr}
              myDef={state.defOvr}
              myOvr={state.teamOverall}
            />
          )}

          {/* ── Em andamento ── */}
          {!isPreGame && (
            <div className="py-8 flex flex-col gap-5">

              {/* 1. Resultado da última partida — destaque máximo */}
              {lastMatch && <LastResultCard match={lastMatch} />}

              {/* 2. Faixa de stats acumulados */}
              <StatsStrip {...visibleStats} />

              {/* 3. Próximo adversário (só se tiver) */}
              {nextScheduled && !finished && (
                <div className="flex flex-col gap-2">
                  <VintageDivider label="Próxima Partida" />
                  <NextOpponentCard next={nextScheduled} round={displayedRound + 1} />
                </div>
              )}

              {/* 4. Histórico colapsável */}
              {visibleMatches.length > 0 && (
                <HistoryAccordion matches={visibleMatches} />
              )}

            </div>
          )}

        </div>
      </div>

      {/* Rodapé fixo com CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-midnight border-t border-gold/15 px-6 py-4 flex flex-col gap-2.5">
        {finished ? (
          <div className="relative max-w-2xl mx-auto w-full">
            <div className="absolute -inset-1.5 border border-gold/30" />
            <button
              onClick={() => router.push('/resultado')}
              className="relative w-full py-4 bg-gold text-midnight font-black text-sm tracking-[0.3em] uppercase hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] transition-all duration-200 border-2 border-gold"
            >
              Ver Resultado Final ◆
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-2.5">
            <div className="relative">
              <div className="absolute -inset-1.5 border border-gold/30" />
              <button
                onClick={() => setDisplayedRound(r => r + 1)}
                className="relative w-full py-4 bg-gold text-midnight font-black text-sm tracking-[0.3em] uppercase hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] transition-all duration-200 border-2 border-gold"
              >
                {isPreGame ? 'Jogar Rodada 1 ◆' : `Próxima Rodada ${displayedRound + 1} ◆`}
              </button>
            </div>
            <button
              onClick={() => setDisplayedRound(totalRounds)}
              className="w-full py-2.5 border border-cream/10 text-cream/35 font-bold text-[11px] uppercase tracking-[0.3em] hover:border-gold/30 hover:text-cream/60 transition-all duration-200"
            >
              Pular para o Final →
            </button>
          </div>
        )}
      </div>

      {/* Footer stamp */}
      <footer className="hidden" />

    </div>
  );
}
