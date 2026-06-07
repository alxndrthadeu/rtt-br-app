'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { saveRanking, getDraft } from '@/lib/api';
import { calculateRanking, RANK_LABELS, RANK_SUBTITLES } from '@/lib/game-engine';
import TeamShield from '@/components/TeamShield';
import { getAbrev } from '@/lib/escudos';
import type { GameState, Draft, LeagueEntry } from '@/types';

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

// ─── Tabela de Classificação (estilo Premier League) ─────────────────────────

function zoneStrip(pos: number) {
  if (pos === 1)  return 'bg-gold';
  if (pos <= 5)   return 'bg-sky-400';
  if (pos <= 8)   return 'bg-amber-400';
  if (pos >= 17)  return 'bg-coral';
  return 'bg-transparent';
}

function LeagueTable({ table }: { table: LeagueEntry[] }) {
  const COLS = ['V', 'E', 'D', 'SG', 'PTS'] as const;

  return (
    <div className="w-full overflow-hidden border border-cream/[0.07]" style={{ borderRadius: 0 }}>

      {/* Cabeçalho colunas */}
      <div className="flex items-center px-3 py-2 border-b border-cream/[0.08] bg-navy/70">
        <div className="w-[3px] shrink-0 mr-1.5" />
        <div className="w-5 shrink-0 mr-2" />
        <div className="w-[18px] shrink-0 mr-2" />
        <div className="flex-1" />
        {COLS.map(c => (
          <span
            key={c}
            className={`text-center text-[8px] uppercase tracking-[0.3em] text-cream/25 font-bold shrink-0 tabular-nums ${
              c === 'PTS' || c === 'SG' ? 'w-8' : 'w-6'
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Linhas */}
      {table.map((entry, i) => {
        const pos      = i + 1;
        const isUser   = entry.team === 'Seu Time';
        const gd       = entry.gf - entry.gc;
        const teamName = isUser ? 'Seu Time' : getAbrev(entry.team);
        const eraTag   = !isUser && entry.era ? `'${entry.era.replace(/\D/g, '').slice(-2)}` : '';

        return (
          <div
            key={`${entry.team}|${entry.era}|${i}`}
            className={`flex items-center px-3 py-[9px] border-b border-cream/[0.04] last:border-b-0 ${isUser ? 'bg-gold/[0.06]' : ''}`}
          >
            {/* Faixa de zona */}
            <div className={`w-[3px] h-6 rounded-full shrink-0 mr-1.5 ${zoneStrip(pos)}`} />

            {/* Posição */}
            <span className={`w-5 text-center text-[11px] font-black shrink-0 mr-2 ${isUser ? 'text-gold' : pos <= 8 ? 'text-cream/60' : pos >= 17 ? 'text-coral/70' : 'text-cream/25'}`}>
              {pos}
            </span>

            {/* Escudo */}
            <div className="w-[18px] shrink-0 mr-2 flex items-center justify-center">
              {isUser
                ? <Image src="/logo.png" alt="" width={16} height={16} className="object-contain opacity-75" />
                : <TeamShield team={entry.team} size={18} />
              }
            </div>

            {/* Nome + era */}
            <div className="flex-1 min-w-0 flex items-baseline gap-1 mr-1">
              <span className={`text-[12px] font-bold truncate leading-tight ${isUser ? 'text-gold' : 'text-cream/75'}`}>
                {teamName}
              </span>
              {eraTag && (
                <span className="text-[8px] text-cream/20 shrink-0 font-mono">{eraTag}</span>
              )}
            </div>

            {/* V */}
            <span className="w-6 text-center text-[11px] text-green/70 tabular-nums shrink-0">{entry.v}</span>
            {/* E */}
            <span className="w-6 text-center text-[11px] text-cream/35 tabular-nums shrink-0">{entry.e}</span>
            {/* D */}
            <span className="w-6 text-center text-[11px] text-coral/60 tabular-nums shrink-0">{entry.d}</span>
            {/* SG */}
            <span className={`w-8 text-center text-[11px] tabular-nums shrink-0 font-mono ${gd > 0 ? 'text-green/80' : gd < 0 ? 'text-coral/80' : 'text-cream/30'}`}>
              {gd > 0 ? `+${gd}` : gd}
            </span>
            {/* PTS */}
            <span className={`w-8 text-center text-sm font-black tabular-nums shrink-0 ${isUser ? 'text-gold' : 'text-cream/90'}`}>
              {entry.pts}
            </span>
          </div>
        );
      })}

      {/* Legenda de zonas */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 border-t border-cream/[0.06] bg-navy/30">
        {[
          { color: 'bg-gold',      label: 'Campeão' },
          { color: 'bg-sky-400',   label: 'Libertadores' },
          { color: 'bg-amber-400', label: 'Sul-Americana' },
          { color: 'bg-coral',     label: 'Rebaixado' },
        ].map(z => (
          <div key={z.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${z.color}`} />
            <span className="text-[9px] text-cream/30 uppercase tracking-wide">{z.label}</span>
          </div>
        ))}
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

async function buildShareCanvas(
  state: GameState,
  rank: string,
  awards: AwardInfo,
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

  // Rank glow
  const glow = ctx.createRadialGradient(W / 2, 640, 0, W / 2, 640, 650);
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

  // Divider
  ctx.strokeStyle = hex + '44';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(130, 246); ctx.lineTo(W - 130, 246); ctx.stroke();

  // ── Rank letter ──────────────────────────────────────────────────────────────
  const rankGrad = ctx.createLinearGradient(W / 2 - 300, 300, W / 2 + 300, 780);
  rankGrad.addColorStop(0, gradTop);
  rankGrad.addColorStop(1, gradBot);
  ctx.font = '900 540px Arial Black, Arial, sans-serif';
  ctx.fillStyle = rankGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(rank, W / 2, 780);

  // ── Rank label ───────────────────────────────────────────────────────────────
  ctx.font = '700 52px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.88)';
  ctx.textAlign = 'center';
  ctx.fillText((RANK_LABELS[rank] ?? '').toUpperCase(), W / 2, 860);

  ctx.font = '400 30px Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'rgba(245,240,232,0.35)';
  const sub = RANK_SUBTITLES[rank] ?? '';
  const subLines = wrapText(ctx, sub, W - 240);
  subLines.forEach((line, i) => ctx.fillText(line, W / 2, 912 + i * 42));

  // ── Stats bar ────────────────────────────────────────────────────────────────
  const statsY = 1010;
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(90, statsY, W - 180, 190);
  ctx.strokeStyle = 'rgba(245,240,232,0.07)';
  ctx.lineWidth = 1;
  ctx.strokeRect(90, statsY, W - 180, 190);

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
    ctx.font = '900 76px Arial Black, Arial, sans-serif';
    ctx.fillStyle = i === 0 ? hex : 'rgba(245,240,232,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(s.value), sx, statsY + 118);
    ctx.font = '600 26px Arial, Helvetica, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.3)';
    ctx.fillText(s.label, sx, statsY + 162);
  });

  // ── Award cards ──────────────────────────────────────────────────────────────
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
      label: 'MELHOR GOLEIRO',
      value: awards.goleiro
        ? `${awards.goleiro.name.split(' ').at(-1)} · ${awards.goleiro.cleanSheets} limpos`
        : '—',
    },
  ];

  awardList.forEach((a, i) => {
    const ay = 1254 + i * 185;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(90, ay, W - 180, 160);
    ctx.strokeStyle = hex + '2A';
    ctx.lineWidth = 1;
    ctx.strokeRect(90, ay, W - 180, 160);

    ctx.font = '44px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(a.icon, 126, ay + 86);

    ctx.font = '600 22px Arial, Helvetica, sans-serif';
    ctx.fillStyle = hex + 'BB';
    ctx.fillText(a.label, 200, ay + 58);

    ctx.font = '700 42px Arial Black, Arial, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.9)';
    ctx.fillText(a.value, 200, ay + 115);
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
  const [destaque, setDestaque] = useState<Draft | null>(null);
  const [awards, setAwards]   = useState<AwardInfo>({ artilheiro: null, goleiro: null, craque: null });
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
      const canvas = await buildShareCanvas(state, rank, awards);
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

        {/* Classificação Geral */}
        {state.leagueTable && state.leagueTable.length > 0 && (
          <div className="w-full flex flex-col gap-4">
            <VintageDivider label="Classificação Geral" />
            <LeagueTable table={state.leagueTable} />
          </div>
        )}

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

        {/* Craque de destaque (maior overall) */}
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
