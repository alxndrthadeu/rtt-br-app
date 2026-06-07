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

const RANK_STYLES: Record<string, {
  letter: string; border: string; bg: string; tag: string; hex: string; grad: [string, string];
}> = {
  S: { letter: 'text-gold',       border: 'border-gold',          bg: 'bg-gold/[0.07]',         tag: 'bg-gold/20 text-gold',              hex: '#C9A84C', grad: ['#C9A84C', '#7A5C0A'] },
  A: { letter: 'text-sky-400',    border: 'border-sky-400/60',    bg: 'bg-sky-400/[0.07]',      tag: 'bg-sky-400/20 text-sky-400',        hex: '#38BDF8', grad: ['#38BDF8', '#0369A1'] },
  B: { letter: 'text-violet-400', border: 'border-violet-400/50', bg: 'bg-violet-400/[0.06]',   tag: 'bg-violet-400/20 text-violet-400',  hex: '#A78BFA', grad: ['#A78BFA', '#5B21B6'] },
  C: { letter: 'text-amber-400',  border: 'border-amber-400/50',  bg: 'bg-amber-400/[0.06]',    tag: 'bg-amber-400/20 text-amber-400',    hex: '#FBB134', grad: ['#FBB134', '#92400E'] },
  D: { letter: 'text-coral',      border: 'border-coral/50',      bg: 'bg-coral/[0.06]',        tag: 'bg-coral/20 text-coral',            hex: '#FF6B6B', grad: ['#FF6B6B', '#991B1B'] },
};

interface AwardInfo {
  artilheiro: { name: string; goals: number; team: string } | null;
  goleiro:    { name: string; cleanSheets: number; team: string } | null;
  craque:     { name: string; ovr: number; team: string; era: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function VintageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gold/40" />
      <p className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gold/40" />
    </div>
  );
}

function AwardCard({ icon, label, name, sub, shield }: {
  icon: string; label: string; name: string; sub: string; shield?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 border border-cream/[0.08]" />
      <div className="absolute inset-[3px] border border-cream/[0.03]" />
      <div className="relative bg-navy/50 px-4 py-3.5 flex items-center gap-4">
        <div className="w-10 h-10 flex items-center justify-center shrink-0 border border-gold/20 bg-gold/[0.05] text-xl leading-none">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[8px] uppercase tracking-[0.45em] text-gold/60 font-bold mb-0.5">{label}</div>
          <div className="font-black text-sm uppercase tracking-wide text-cream truncate leading-tight">{name}</div>
          <div className="text-[11px] text-cream/35 uppercase tracking-wide mt-0.5">{sub}</div>
        </div>
        {shield && <TeamShield team={shield} size={30} className="shrink-0 opacity-70" />}
      </div>
    </div>
  );
}

// ─── Share card (Canvas) ──────────────────────────────────────────────────────

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function sectionDivider(ctx: CanvasRenderingContext2D, label: string, y: number, hex: string, W: number) {
  ctx.font = '700 22px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + 'BB';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, W / 2, y);
  const hw = ctx.measureText(label).width / 2 + 18;
  ctx.strokeStyle = hex + '44';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(90, y - 7); ctx.lineTo(W / 2 - hw, y - 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W / 2 + hw, y - 7); ctx.lineTo(W - 90, y - 7); ctx.stroke();
}

async function buildShareCanvas(
  state: GameState,
  rank: string,
  awards: AwardInfo,
  drafts: Draft[],
): Promise<HTMLCanvasElement> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const rs = RANK_STYLES[rank] ?? RANK_STYLES['B'];
  const hex = rs.hex;
  const [gradTop, gradBot] = rs.grad;

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bgGrad.addColorStop(0, '#080D18');
  bgGrad.addColorStop(1, '#0C1426');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 520, 0, W / 2, 520, 520);
  glow.addColorStop(0, hex + '28');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Border ──────────────────────────────────────────────────────────────────
  ctx.strokeStyle = hex + 'AA';
  ctx.lineWidth = 5;
  ctx.strokeRect(48, 48, W - 96, H - 96);
  ctx.strokeStyle = hex + '22';
  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, W - 132, H - 132);

  // ── Branding ─────────────────────────────────────────────────────────────────
  ctx.font = '700 30px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + 'BB';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ALCANCE O TOPO', W / 2, 168);

  ctx.font = '400 24px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.25)';
  ctx.fillText('MINHA CAMPANHA', W / 2, 212);

  ctx.strokeStyle = hex + '44';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(130, 246); ctx.lineTo(W - 130, 246); ctx.stroke();

  // ── Rank letter (420px — compact to make room for team) ──────────────────────
  const rankGrad = ctx.createLinearGradient(W / 2 - 240, 260, W / 2 + 240, 630);
  rankGrad.addColorStop(0, gradTop);
  rankGrad.addColorStop(1, gradBot);
  ctx.font = '900 420px Arial Black, Arial, sans-serif';
  ctx.fillStyle = rankGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(rank, W / 2, 630);

  // ── Rank label + subtitle ────────────────────────────────────────────────────
  ctx.font = '700 44px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.88)';
  ctx.textAlign = 'center';
  ctx.fillText((RANK_LABELS[rank] ?? '').toUpperCase(), W / 2, 696);

  ctx.font = '400 26px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.35)';
  const sub = RANK_SUBTITLES[rank] ?? '';
  const subLines = wrapText(ctx, sub, W - 240);
  subLines.forEach((line, i) => ctx.fillText(line, W / 2, 746 + i * 40));

  // ── Stats bar ────────────────────────────────────────────────────────────────
  const statsY = 746 + subLines.length * 40 + 30;
  const statsH = 150;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(90, statsY, W - 180, statsH);
  ctx.strokeStyle = 'rgba(245,240,232,0.07)';
  ctx.lineWidth = 1;
  ctx.strokeRect(90, statsY, W - 180, statsH);

  const statItems: { label: string; value: number }[] = [
    { label: 'PTS', value: state.pts },
    { label: 'V',   value: state.v   },
    { label: 'E',   value: state.e   },
    { label: 'D',   value: state.d   },
    { label: 'GF',  value: state.gf  },
  ];
  const sw = (W - 180) / statItems.length;
  statItems.forEach((s, i) => {
    const sx = 90 + i * sw + sw / 2;
    ctx.font = '900 64px Arial Black, Arial, sans-serif';
    ctx.fillStyle = i === 0 ? hex : 'rgba(245,240,232,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(s.value), sx, statsY + 96);
    ctx.font = '600 22px Arial, Helvetica, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.3)';
    ctx.fillText(s.label, sx, statsY + 132);
  });

  // ── Team section ──────────────────────────────────────────────────────────────
  const teamLabelY = statsY + statsH + 50;
  sectionDivider(ctx, 'MEU TIME', teamLabelY, hex, W);

  const sorted = [...drafts].filter(d => d.player).sort((a, b) => a.slot_index - b.slot_index);
  const rowH = 36;
  sorted.forEach((d, i) => {
    const ry = teamLabelY + 16 + i * rowH;

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(90, ry, W - 180, rowH);
    }

    // Position badge
    ctx.fillStyle = hex + '1A';
    ctx.fillRect(90, ry + 2, 58, rowH - 4);
    ctx.font = '700 17px Arial, Helvetica, sans-serif';
    ctx.fillStyle = hex + 'CC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.slot_pos, 119, ry + rowH / 2);

    // Player name (last word / mononym)
    ctx.font = '500 22px Arial, Helvetica, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.82)';
    ctx.textAlign = 'left';
    ctx.fillText(d.player!.name.split(' ').at(-1)!, 162, ry + rowH / 2);

    // Overall
    ctx.font = '700 19px Arial, Helvetica, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.32)';
    ctx.textAlign = 'right';
    ctx.fillText(String(d.player!.overall), W - 90, ry + rowH / 2);
  });

  // ── Awards section ────────────────────────────────────────────────────────────
  const teamEndY   = teamLabelY + 16 + sorted.length * rowH;
  const awardsLabelY = teamEndY + 48;
  sectionDivider(ctx, 'PRÊMIOS', awardsLabelY, hex, W);

  const awardList = [
    {
      icon: '⚽',
      label: 'ARTILHEIRO',
      value: awards.artilheiro
        ? `${awards.artilheiro.name.split(' ').at(-1)} · ${awards.artilheiro.goals} GOLS`
        : '—',
    },
    {
      icon: '⭐',
      label: 'CRAQUE',
      value: awards.craque
        ? `${awards.craque.name.split(' ').at(-1)} · ${awards.craque.ovr} OVR`
        : '—',
    },
    {
      icon: '🧤',
      label: 'GOLEIRO',
      value: awards.goleiro
        ? `${awards.goleiro.name.split(' ').at(-1)} · ${awards.goleiro.cleanSheets} limpos`
        : '—',
    },
  ];

  const awardH = 90;
  const awardGap = 8;
  awardList.forEach((a, i) => {
    const ay = awardsLabelY + 18 + i * (awardH + awardGap);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(90, ay, W - 180, awardH);
    ctx.strokeStyle = hex + '2A';
    ctx.lineWidth = 1;
    ctx.strokeRect(90, ay, W - 180, awardH);

    ctx.font = '30px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.icon, 122, ay + awardH / 2);

    ctx.font = '600 18px Arial, Helvetica, sans-serif';
    ctx.fillStyle = hex + 'BB';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(a.label, 178, ay + 32);

    ctx.font = '700 28px Arial Black, Arial, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.9)';
    ctx.fillText(a.value, 178, ay + 72);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  ctx.font = '400 26px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + '55';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('alcanceotopobrasil.com.br', W / 2, H - 82);

  return canvas;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultadoPage() {
  const router = useRouter();
  const [state, setState]     = useState<GameState | null>(null);
  const [rank, setRank]       = useState('');
  const [destaque, setDestaque]   = useState<Draft | null>(null);
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [awards, setAwards]       = useState<AwardInfo>({ artilheiro: null, goleiro: null, craque: null });
  const [saved, setSaved]     = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) { router.push('/'); return; }
    const gs: GameState = JSON.parse(raw);
    setState(gs);
    setRank(calculateRanking(gs.pts));

    // Artilheiro: conta gols dos my_scorers
    const goalMap = new Map<string, { goals: number; team: string }>();
    for (const m of gs.matches) {
      for (const s of m.my_scorers ?? []) {
        const prev = goalMap.get(s.name);
        goalMap.set(s.name, { goals: (prev?.goals ?? 0) + 1, team: prev?.team ?? '' });
      }
    }
    const cleanSheets = gs.matches.filter(m => m.opp_goals === 0).length;

    getDraft(gs.gameId).then((drafts) => {
      setAllDrafts(drafts);

      // Destaque (maior overall)
      const best = drafts.reduce<Draft | null>((prev, curr) =>
        (curr.player?.overall ?? 0) > (prev?.player?.overall ?? 0) ? curr : prev, null);
      setDestaque(best);

      // Relaciona artilheiro ao time via draft
      for (const d of drafts) {
        if (d.player && goalMap.has(d.player.name)) {
          goalMap.set(d.player.name, { ...goalMap.get(d.player.name)!, team: d.player.team });
        }
      }
      const topScorer = Array.from(goalMap.entries()).sort((a, b) => b[1].goals - a[1].goals)[0];

      // Goleiro
      const gkDraft = drafts.find(d => d.slot_pos === 'GK');

      // Craque: índice de desempenho por posição
      const atkRoles = new Set(['CA', 'PE', 'PD', 'MEI']);
      const bestPerf = drafts
        .filter(d => d.player)
        .map(d => {
          const ovr   = d.player!.overall;
          const goals = goalMap.get(d.player!.name)?.goals ?? 0;
          const score = d.slot_pos === 'GK'
            ? ovr + cleanSheets * 4
            : atkRoles.has(d.slot_pos) ? ovr + goals * 5 : ovr + goals * 2;
          return { d, score };
        })
        .sort((a, b) => b.score - a.score)[0];

      setAwards({
        artilheiro: topScorer
          ? { name: topScorer[0], goals: topScorer[1].goals, team: topScorer[1].team }
          : null,
        goleiro: gkDraft?.player
          ? { name: gkDraft.player.name, cleanSheets, team: gkDraft.player.team }
          : null,
        craque: bestPerf?.d.player
          ? { name: bestPerf.d.player.name, ovr: bestPerf.d.player.overall, team: bestPerf.d.player.team, era: bestPerf.d.player.era }
          : null,
      });
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

  async function handleShare() {
    if (!state || !rank || sharing) return;
    setSharing(true);
    try {
      const canvas = await buildShareCanvas(state, rank, awards, allDrafts);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'minha-campanha-rtt.png', { type: 'image/png' });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Alcance o Topo · Rank ${rank}`,
              text: `Terminei minha campanha com ${state!.pts} pts e rank ${rank}! 🏆`,
            });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'minha-campanha-rtt.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch {
          // user cancelled share
        }
      }, 'image/png');
    } finally {
      setSharing(false);
    }
  }

  function handlePlayAgain() {
    localStorage.removeItem(GAME_STATE_KEY);
    router.push('/');
  }

  if (!state) return null;

  const style = RANK_STYLES[rank] ?? RANK_STYLES['B'];
  const hasAwards = awards.artilheiro || awards.craque || awards.goleiro;

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

        {/* Eyebrow */}
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
                { label: 'V',   value: state.v   },
                { label: 'E',   value: state.e   },
                { label: 'D',   value: state.d   },
                { label: 'GF',  value: state.gf  },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="text-3xl font-black text-cream">{value}</div>
                  <div className="text-[9px] uppercase tracking-[0.35em] text-cream/35">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prêmios da Temporada */}
        {hasAwards && (
          <div className="w-full flex flex-col gap-4">
            <VintageDivider label="Prêmios da Temporada" />
            <div className="flex flex-col gap-2.5">
              {awards.artilheiro && (
                <AwardCard
                  icon="⚽"
                  label="Artilheiro do Campeonato"
                  name={awards.artilheiro.name}
                  sub={`${awards.artilheiro.goals} ${awards.artilheiro.goals === 1 ? 'Gol' : 'Gols'}`}
                  shield={awards.artilheiro.team || undefined}
                />
              )}
              {awards.craque && (
                <AwardCard
                  icon="⭐"
                  label="Craque da Temporada"
                  name={awards.craque.name}
                  sub={`${awards.craque.ovr} OVR · ${getAbrev(awards.craque.team)}`}
                  shield={awards.craque.team}
                />
              )}
              {awards.goleiro && (
                <AwardCard
                  icon="🧤"
                  label="Melhor Goleiro"
                  name={awards.goleiro.name}
                  sub={`${awards.goleiro.cleanSheets} ${awards.goleiro.cleanSheets === 1 ? 'Jogo Limpo' : 'Jogos Limpos'}`}
                  shield={awards.goleiro.team}
                />
              )}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className={`w-full py-3.5 border-2 font-black text-sm tracking-[0.25em] uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              sharing
                ? 'border-cream/10 text-cream/25 cursor-not-allowed'
                : `${style.border} ${style.letter} hover:bg-white/[0.03]`
            }`}
          >
            {sharing ? 'Gerando...' : '↑ Compartilhar Campanha'}
          </button>

          <div className="flex gap-3">
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
