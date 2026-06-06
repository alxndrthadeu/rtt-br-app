'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getPlayerRankings } from '@/lib/api';
import { usePlayerUUID } from '@/hooks/usePlayerUUID';
import { RANK_LABELS } from '@/lib/game-engine';
import type { Ranking } from '@/types';

const RANK_COLOR: Record<string, string> = {
  S: 'text-gold',
  A: 'text-green',
  B: 'text-cream/80',
  C: 'text-coral',
  D: 'text-coral/70',
};

const RANK_BORDER: Record<string, string> = {
  S: 'border-gold/40',
  A: 'border-green/40',
  B: 'border-cream/15',
  C: 'border-coral/40',
  D: 'border-coral/25',
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

export default function HistoricoPage() {
  const router = useRouter();
  const playerUUID = usePlayerUUID();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerUUID) return;
    getPlayerRankings(playerUUID)
      .then(setRankings)
      .finally(() => setLoading(false));
  }, [playerUUID]);

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
          Histórico
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

        {/* Title block */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px w-6 bg-gold/60" />
            <p className="text-[8px] tracking-[0.6em] uppercase text-gold font-bold">Alcance o Topo</p>
            <div className="h-px w-6 bg-gold/60" />
          </div>
          <h1 className="text-[2.8rem] font-black text-cream tracking-tight leading-none uppercase">
            Suas Partidas
          </h1>
        </div>

        <VintageDivider label={`${rankings.length} registro${rankings.length !== 1 ? 's' : ''}`} />

        {/* Loading */}
        {loading && (
          <div className="relative">
            <div className="absolute inset-0 border border-cream/10" />
            <div className="relative p-10 text-center text-cream/30 text-[10px] uppercase tracking-[0.4em]">
              Carregando...
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && rankings.length === 0 && (
          <div className="border-2 border-dashed border-gold/20 p-12 text-center flex flex-col items-center gap-4">
            <p className="text-sm font-bold text-cream/40 uppercase tracking-[0.3em]">
              Nenhuma partida encontrada
            </p>
            <p className="text-[11px] text-cream/25 tracking-wide">Jogue sua primeira run!</p>
            <div className="relative mt-2">
              <div className="absolute -inset-1.5 border border-gold/30" />
              <button
                onClick={() => router.push('/')}
                className="relative px-10 py-3.5 bg-gold text-midnight font-black uppercase tracking-[0.25em] text-sm hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] transition-all duration-200 border-2 border-gold"
              >
                Jogar Agora ◆
              </button>
            </div>
          </div>
        )}

        {/* Rankings list */}
        <div className="flex flex-col gap-3">
          {rankings.map((r) => (
            <div
              key={r.id}
              className={`relative bg-navy/50 hover:bg-navy/80 transition-colors`}
            >
              <div className={`absolute inset-0 border ${RANK_BORDER[r.rank] ?? 'border-cream/10'}`} />
              <div className={`absolute inset-[3px] border ${RANK_BORDER[r.rank] ?? 'border-cream/10'} opacity-30`} />
              <div className="relative p-5 flex items-center gap-5">

                {/* Rank letter */}
                <div className={`text-[3.2rem] font-black w-14 text-center shrink-0 leading-none ${RANK_COLOR[r.rank] ?? 'text-cream'}`}>
                  {r.rank}
                </div>

                <div className="w-px h-10 bg-cream/10 shrink-0" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-cream">
                    {RANK_LABELS[r.rank]}
                  </div>
                  {r.game && (
                    <div className="text-[11px] text-cream/40 mt-1 uppercase tracking-wide">
                      {r.game.pts} pts · {r.game.v}V {r.game.e}E {r.game.d}D · {r.game.formation}
                    </div>
                  )}
                  <div className="text-[9px] text-cream/25 mt-1.5 tracking-[0.25em] uppercase">
                    {new Date(r.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Destaque player */}
                {r.destaque_player && (
                  <div className="text-right shrink-0 pl-3 border-l border-cream/10">
                    <div className="text-[9px] text-cream/30 uppercase tracking-[0.3em]">Destaque</div>
                    <div className="text-sm font-black mt-0.5 text-cream/80">
                      {r.destaque_player.name.split(' ').slice(-1)[0]}
                    </div>
                    <div className="text-2xl font-black text-gold leading-tight">{r.destaque_overall}</div>
                  </div>
                )}

              </div>
            </div>
          ))}
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
