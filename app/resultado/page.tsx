'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { saveRanking, getDraft } from '@/lib/api';
import { calculateRanking, RANK_LABELS, RANK_SUBTITLES } from '@/lib/game-engine';
import TeamShield from '@/components/TeamShield';
import { getAbrev } from '@/lib/escudos';
import type { GameState, Draft } from '@/types';

const GAME_STATE_KEY = 'rtt_game_state';

// S = ouro (Campeão histórico), A = azul (Campeão), B = roxo (Libertadores),
// C = amarelo (Sul-Americana), D = vermelho (Rebaixado)
const RANK_STYLES: Record<string, { letter: string; border: string; bg: string; tag: string }> = {
  S: { letter: 'text-gold',          border: 'border-gold',        bg: 'bg-gold/[0.07]',      tag: 'bg-gold/20 text-gold' },
  A: { letter: 'text-sky-400',       border: 'border-sky-400/60',  bg: 'bg-sky-400/[0.07]',   tag: 'bg-sky-400/20 text-sky-400' },
  B: { letter: 'text-violet-400',    border: 'border-violet-400/50', bg: 'bg-violet-400/[0.06]', tag: 'bg-violet-400/20 text-violet-400' },
  C: { letter: 'text-amber-400',     border: 'border-amber-400/50', bg: 'bg-amber-400/[0.06]', tag: 'bg-amber-400/20 text-amber-400' },
  D: { letter: 'text-coral',         border: 'border-coral/50',    bg: 'bg-coral/[0.06]',     tag: 'bg-coral/20 text-coral' },
};

function VintageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gold/40" />
      <p className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gold/40" />
    </div>
  );
}

export default function ResultadoPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [rank, setRank] = useState('');
  const [destaque, setDestaque] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) { router.push('/'); return; }
    const gs: GameState = JSON.parse(raw);
    const r = calculateRanking(gs.pts);
    setState(gs);
    setRank(r);

    getDraft(gs.gameId).then((drafts) => {
      const best = drafts.reduce<Draft | null>((prev, curr) => {
        if (!prev) return curr;
        return (curr.player?.overall ?? 0) > (prev.player?.overall ?? 0) ? curr : prev;
      }, null);
      setDestaque(best);
    });
  }, [router]);

  useEffect(() => {
    if (!state || !rank || saved || !destaque) return;
    setSaved(true);
    saveRanking({
      game_id: state.gameId,
      rank,
      destaque_player_id: destaque.player_id,
      destaque_overall: destaque.player?.overall ?? state.teamOverall,
      pts: state.pts,
      v: state.v,
      e: state.e,
      d: state.d,
      gf: state.gf,
      gc: state.gc,
    }).catch(() => null);
  }, [state, rank, saved, destaque]);

  function handlePlayAgain() {
    localStorage.removeItem(GAME_STATE_KEY);
    router.push('/');
  }

  if (!state) return null;

  const style = RANK_STYLES[rank] ?? RANK_STYLES['B'];

  return (
    <div className="min-h-screen bg-midnight flex flex-col relative z-10">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gold/15">
        <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
          <Image src="/logo.png" alt="Alcance o Topo" width={34} height={34} className="object-contain" />
          <div className="w-px h-5 bg-cream/15" />
          <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-cream/30 group-hover:text-cream/70 transition-colors">
            ← Início
          </span>
        </button>
        <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-gold/60">
          Resultado Final
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center py-12 px-6 gap-8 max-w-lg mx-auto w-full">

        {/* Title eyebrow */}
        <div className="flex items-center gap-2 self-stretch justify-center">
          <div className="h-px w-8 bg-gold/50" />
          <p className="text-[8px] tracking-[0.6em] uppercase text-gold font-bold">Temporada Encerrada</p>
          <div className="h-px w-8 bg-gold/50" />
        </div>

        {/* Rank badge */}
        <div className={`relative w-full ${style.bg}`}>
          <div className={`absolute inset-0 border-2 ${style.border}`} />
          <div className={`absolute inset-[4px] border ${style.border} opacity-30`} />
          <div className="relative px-12 py-10 text-center flex flex-col items-center gap-3">
            <div className={`text-[8rem] font-black leading-none ${style.letter}`}>{rank}</div>
            <div className="text-base font-black uppercase tracking-[0.3em] text-cream/80">
              {RANK_LABELS[rank]}
            </div>
            <p className="text-[11px] text-cream/40 tracking-wide max-w-[220px] leading-relaxed">
              {RANK_SUBTITLES[rank]}
            </p>
            <span className={`mt-1 px-3 py-1 text-[9px] font-black uppercase tracking-[0.35em] rounded-sm ${style.tag}`}>
              {state.pts} pts · {Math.round((state.pts / 114) * 100)}% aproveitamento
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full flex flex-col gap-4">
          <VintageDivider label="Estatísticas" />
          <div className="relative bg-navy/60">
            <div className="absolute inset-0 border border-cream/10" />
            <div className="absolute inset-[3px] border border-cream/[0.05]" />
            <div className="relative p-6 grid grid-cols-5 text-center gap-4">
              {[
                { label: 'PTS', value: state.pts },
                { label: 'V', value: state.v },
                { label: 'E', value: state.e },
                { label: 'D', value: state.d },
                { label: 'GF', value: state.gf },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-black text-cream">{value}</div>
                  <div className="text-[9px] uppercase tracking-[0.35em] text-cream/35">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Destaque */}
        {destaque?.player && (
          <div className="w-full flex flex-col gap-4">
            <VintageDivider label="Jogador de Destaque" />
            <div className="relative bg-navy/60">
              <div className="absolute inset-0 border border-gold/30" />
              <div className="absolute inset-[3px] border border-gold/10" />
              <div className="relative p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeamShield team={destaque.player.team} size={40} className="shrink-0 drop-shadow" />
                  <div>
                    <div className="text-lg font-black uppercase tracking-wide text-cream">
                      {destaque.player.name}
                    </div>
                    <div className="text-xs uppercase tracking-widest text-cream/40 mt-1">
                      {getAbrev(destaque.player.team)} · {destaque.player.era}
                    </div>
                  </div>
                </div>
                <div className="text-[4.5rem] font-black text-gold leading-none">{destaque.player.overall}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full mt-2">
          <div className="relative flex-1">
            <div className="absolute -inset-1 border border-gold/30" />
            <button
              onClick={handlePlayAgain}
              className="relative w-full py-4 bg-gold text-midnight font-black uppercase tracking-[0.25em] text-sm hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] transition-all duration-200 border-2 border-gold"
            >
              Jogar Novamente ◆
            </button>
          </div>
          <button
            onClick={() => router.push('/historico')}
            className="flex-1 py-4 border-2 border-cream/15 bg-navy/40 text-cream/55 font-black uppercase tracking-widest text-sm hover:border-gold/50 hover:text-cream/80 transition-colors"
          >
            Histórico
          </button>
        </div>

      </div>

      {/* Footer stamp */}
      <footer className="flex items-center justify-center py-4 gap-3 border-t border-gold/20">
        <div className="h-px w-8 bg-gold/40" />
        <span className="text-[8px] tracking-[0.5em] uppercase text-gold/35 font-bold">
          Alcance o Topo · Est. 2026
        </span>
        <div className="h-px w-8 bg-gold/40" />
      </footer>

    </div>
  );
}
