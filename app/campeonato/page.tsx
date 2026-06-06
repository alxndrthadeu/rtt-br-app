'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getPoints } from '@/lib/game-engine';
import TeamShield from '@/components/TeamShield';
import { getAbrev } from '@/lib/escudos';
import type { GameState, LocalMatch, ScheduledMatch } from '@/types';

const GAME_STATE_KEY = 'rtt_game_state';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resultStyle(result: 'V' | 'E' | 'D') {
  if (result === 'V') return { strip: 'bg-green',  text: 'text-green',  label: 'Vitória',  badge: 'bg-green/15 text-green border-green/30' };
  if (result === 'E') return { strip: 'bg-gold',   text: 'text-gold',   label: 'Empate',   badge: 'bg-gold/15 text-gold border-gold/30' };
  return               { strip: 'bg-coral',  text: 'text-coral',  label: 'Derrota',  badge: 'bg-coral/15 text-coral border-coral/30' };
}

// ─── Pill de progresso ────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="px-4 py-3 border-b border-cream/[0.07]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-[0.4em] text-cream/35 font-bold">Temporada</span>
        <span className="text-[9px] font-black text-cream/50">{current} / {total}</span>
      </div>
      <div className="h-1 bg-cream/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Faixa de stats compacta ──────────────────────────────────────────────────

function StatsBar({ pts, v, e, d, gf, gc }: { pts: number; v: number; e: number; d: number; gf: number; gc: number }) {
  return (
    <div className="grid grid-cols-6 border-b border-cream/[0.07]">
      {[
        { label: 'PTS', value: pts, accent: true },
        { label: 'V',   value: v },
        { label: 'E',   value: e },
        { label: 'D',   value: d },
        { label: 'GF',  value: gf },
        { label: 'GC',  value: gc },
      ].map(({ label, value, accent }) => (
        <div key={label} className="py-3 text-center border-r border-cream/[0.07] last:border-r-0">
          <p className={`text-base font-black leading-none ${accent ? 'text-gold' : 'text-cream/80'}`}>{value}</p>
          <p className="text-[8px] uppercase tracking-[0.3em] text-cream/25 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Form strip (últimos 5) ───────────────────────────────────────────────────

function FormStrip({ matches }: { matches: LocalMatch[] }) {
  const last5 = [...matches].slice(-5);
  if (last5.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cream/[0.07]">
      <span className="text-[8px] uppercase tracking-[0.4em] text-cream/25 font-bold mr-1">Forma</span>
      {last5.map((m, i) => {
        const s = resultStyle(m.result);
        return (
          <div key={i} className={`w-6 h-6 flex items-center justify-center rounded-sm text-[9px] font-black ${s.strip === 'bg-green' ? 'bg-green/25 text-green' : s.strip === 'bg-gold' ? 'bg-gold/25 text-gold' : 'bg-coral/25 text-coral'}`}>
            {m.result}
          </div>
        );
      })}
    </div>
  );
}

// ─── Card da partida (hero - último resultado) ────────────────────────────────

function HeroMatchCard({ match }: { match: LocalMatch }) {
  const s = resultStyle(match.result);
  return (
    <div className="mx-4 mt-4 rounded-xl overflow-hidden border border-cream/[0.08] bg-navy/50">
      {/* Top label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[9px] uppercase tracking-[0.4em] text-cream/30">
          Rodada {match.rodada} · {match.isHome ? 'Em Casa' : 'Fora de Casa'}
        </span>
        <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-sm border ${s.badge}`}>
          {s.label}
        </span>
      </div>

      {/* Placar */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-1">
        {/* Seu time */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="Seu Time" width={44} height={44} className="object-contain" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cream/50">Seu Time</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 px-2">
          <span className={`text-5xl font-black tabular-nums leading-none ${match.my_goals > match.opp_goals ? 'text-cream' : 'text-cream/60'}`}>
            {match.my_goals}
          </span>
          <span className="text-cream/20 text-2xl font-black">–</span>
          <span className={`text-5xl font-black tabular-nums leading-none ${match.opp_goals > match.my_goals ? 'text-cream' : 'text-cream/60'}`}>
            {match.opp_goals}
          </span>
        </div>

        {/* Oponente */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamShield team={match.opp_team} size={44} className="drop-shadow" />
          <span className="text-[10px] font-black uppercase tracking-widest text-cream/50">
            {getAbrev(match.opp_team)}
          </span>
        </div>
      </div>

      {/* Bottom strip colorida */}
      <div className={`h-1 ${s.strip}`} />
    </div>
  );
}

// ─── Card de fixture (lista de partidas) ─────────────────────────────────────

function FixtureRow({ match }: { match: LocalMatch }) {
  const s = resultStyle(match.result);
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-cream/[0.05] last:border-b-0">
      {/* Strip lateral */}
      <div className={`w-1 h-8 rounded-full shrink-0 ${s.strip}`} />

      {/* Rodada */}
      <span className="text-[10px] text-cream/25 w-5 shrink-0 font-bold">{match.rodada}</span>

      {/* Times */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Image src="/logo.png" alt="" width={18} height={18} className="object-contain opacity-60 shrink-0" />
        <span className="text-[11px] font-bold text-cream/55 uppercase tracking-wide truncate">
          Seu Time
        </span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-sm font-black tabular-nums ${match.my_goals > match.opp_goals ? 'text-cream' : 'text-cream/50'}`}>
          {match.my_goals}
        </span>
        <span className="text-cream/20 text-xs">–</span>
        <span className={`text-sm font-black tabular-nums ${match.opp_goals > match.my_goals ? 'text-cream' : 'text-cream/50'}`}>
          {match.opp_goals}
        </span>
      </div>

      {/* Oponente */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span className="text-[11px] font-bold text-cream/55 uppercase tracking-wide truncate">
          {getAbrev(match.opp_team)}
        </span>
        <TeamShield team={match.opp_team} size={18} className="shrink-0 opacity-90" />
      </div>

      {/* H/A */}
      <span className="text-[8px] text-cream/20 shrink-0 w-3">{match.isHome ? 'H' : 'A'}</span>
    </div>
  );
}

// ─── Próxima partida ──────────────────────────────────────────────────────────

function NextFixtureCard({ next, round }: { next: ScheduledMatch; round: number }) {
  return (
    <div className="mx-4 rounded-xl overflow-hidden border border-cream/[0.08] bg-navy/30">
      <div className="px-4 pt-3 pb-1">
        <span className="text-[9px] uppercase tracking-[0.45em] text-gold/60 font-bold">
          Próxima · Rodada {round} · {next.isHome ? 'Em Casa' : 'Fora de Casa'}
        </span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <Image src="/logo.png" alt="Seu Time" width={36} height={36} className="object-contain opacity-70" />
        <div className="flex-1 text-center">
          <span className="text-[11px] text-cream/20 uppercase tracking-widest font-bold">vs</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-black uppercase tracking-widest text-cream/70">{getAbrev(next.opponent.team)}</p>
            <p className="text-[9px] text-cream/30 uppercase tracking-wide">{next.opponent.era}</p>
          </div>
          <TeamShield team={next.opponent.team} size={36} className="drop-shadow" />
        </div>
      </div>
      <div className="px-4 pb-3 flex gap-4">
        <div>
          <span className="text-[10px] font-black text-coral">{next.opponent.atkOvr}</span>
          <span className="text-[8px] text-cream/25 ml-1 uppercase tracking-wide">Atk</span>
        </div>
        <div>
          <span className="text-[10px] font-black text-green">{next.opponent.defOvr}</span>
          <span className="text-[8px] text-cream/25 ml-1 uppercase tracking-wide">Def</span>
        </div>
        <div>
          <span className="text-[10px] font-black text-cream/50">{Math.round((next.opponent.atkOvr + next.opponent.defOvr) / 2)}</span>
          <span className="text-[8px] text-cream/25 ml-1 uppercase tracking-wide">OVR</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pre-game (antes de jogar) ────────────────────────────────────────────────

function PreGameCard({ next, myAtk, myDef, myOvr }: { next: ScheduledMatch; myAtk: number; myDef: number; myOvr: number }) {
  return (
    <div className="mx-4 mt-4 rounded-xl overflow-hidden border border-gold/20 bg-navy/40">
      <div className="px-4 pt-3 pb-1 border-b border-cream/[0.07]">
        <span className="text-[9px] uppercase tracking-[0.45em] text-gold/70 font-bold">
          Rodada 1 · {next.isHome ? 'Em Casa' : 'Fora de Casa'}
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-5">
        {/* Meu time */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="Seu Time" width={48} height={48} className="object-contain" />
          <span className="text-[9px] uppercase tracking-widest text-cream/40 font-bold">Seu Time</span>
          <div className="flex gap-3 mt-1">
            <div className="text-center">
              <p className="text-xs font-black text-coral">{myAtk}</p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">Atk</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-green">{myDef}</p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">Def</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-gold">{myOvr}</p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">OVR</p>
            </div>
          </div>
        </div>

        <span className="text-cream/15 text-xl font-black">vs</span>

        {/* Oponente */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <TeamShield team={next.opponent.team} size={48} className="drop-shadow" />
          <span className="text-[9px] uppercase tracking-widest text-cream/40 font-bold">{getAbrev(next.opponent.team)}</span>
          <div className="flex gap-3 mt-1">
            <div className="text-center">
              <p className="text-xs font-black text-coral">{next.opponent.atkOvr}</p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">Atk</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-green">{next.opponent.defOvr}</p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">Def</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-cream/60">
                {Math.round((next.opponent.atkOvr + next.opponent.defOvr) / 2)}
              </p>
              <p className="text-[7px] uppercase tracking-wide text-cream/25">OVR</p>
            </div>
          </div>
        </div>
      </div>
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
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-cream/[0.07] shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Alcance o Topo" width={28} height={28} className="object-contain" />
          <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-cream/30 group-hover:text-cream/60 transition-colors">
            ← Início
          </span>
        </button>
        <span className="text-[9px] tracking-[0.4em] uppercase font-black text-gold/70">
          {finished ? 'Temporada Encerrada' : isPreGame ? 'Temporada · 38 Rodadas' : `Rodada ${displayedRound} / ${totalRounds}`}
        </span>
      </header>

      {/* Barra de progresso + stats */}
      {!isPreGame && (
        <>
          <ProgressBar current={displayedRound} total={totalRounds} />
          <StatsBar {...visibleStats} />
          <FormStrip matches={visibleMatches} />
        </>
      )}

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto pb-36">

        {/* Pré-jogo */}
        {isPreGame && nextScheduled && (
          <PreGameCard
            next={nextScheduled}
            myAtk={state.attackOvr}
            myDef={state.defOvr}
            myOvr={state.teamOverall}
          />
        )}

        {/* Em andamento */}
        {!isPreGame && (
          <>
            {/* Último resultado — hero */}
            {lastMatch && <HeroMatchCard match={lastMatch} />}

            {/* Próximo adversário */}
            {nextScheduled && !finished && (
              <div className="mt-3">
                <NextFixtureCard next={nextScheduled} round={displayedRound + 1} />
              </div>
            )}

            {/* Lista de partidas */}
            {visibleMatches.length > 0 && (
              <div className="mt-4 mx-4 rounded-xl overflow-hidden border border-cream/[0.07] bg-navy/30">
                <div className="px-4 py-2.5 border-b border-cream/[0.07]">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-cream/30 font-bold">
                    Partidas · {visibleMatches.length}
                  </span>
                </div>
                <div>
                  {[...visibleMatches].reverse().map((m) => (
                    <FixtureRow key={m.rodada} match={m} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Rodapé fixo com CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-midnight/95 backdrop-blur-sm border-t border-cream/[0.07] px-4 py-3 flex flex-col gap-2">
        {finished ? (
          <button
            onClick={() => router.push('/resultado')}
            className="w-full py-4 bg-gold text-midnight font-black text-sm tracking-[0.3em] uppercase rounded-lg hover:bg-gold/90 transition-colors"
          >
            Ver Resultado Final ◆
          </button>
        ) : (
          <>
            <button
              onClick={() => setDisplayedRound(r => r + 1)}
              className="w-full py-4 bg-gold text-midnight font-black text-sm tracking-[0.25em] uppercase rounded-lg hover:bg-gold/90 transition-colors"
            >
              {isPreGame ? 'Jogar Rodada 1 ◆' : `Próxima Rodada ${displayedRound + 1} ◆`}
            </button>
            <button
              onClick={() => setDisplayedRound(totalRounds)}
              className="w-full py-2 text-cream/25 font-bold text-[11px] uppercase tracking-[0.3em] hover:text-cream/50 transition-colors"
            >
              Pular para o Final →
            </button>
          </>
        )}
      </div>

    </div>
  );
}
