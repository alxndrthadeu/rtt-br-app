'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { saveRanking, getDraft } from '@/lib/api';
import { calculateRanking, RANK_LABELS, RANK_SUBTITLES } from '@/lib/game-engine';
import TeamShield from '@/components/TeamShield';
import { getAbrev } from '@/lib/escudos';
import type { GameState, Draft } from '@/types';

const GAME_STATE_KEY = 'rtt_game_state';

const RANK_STYLES: Record<string, {
  letter: string; border: string; bg: string; tag: string; hex: string;
}> = {
  S: { letter: 'text-gold',       border: 'border-gold',          bg: 'bg-gold/[0.07]',       tag: 'bg-gold/20 text-gold',             hex: '#C9A84C' },
  A: { letter: 'text-sky-400',    border: 'border-sky-400/60',    bg: 'bg-sky-400/[0.07]',    tag: 'bg-sky-400/20 text-sky-400',       hex: '#38BDF8' },
  B: { letter: 'text-violet-400', border: 'border-violet-400/50', bg: 'bg-violet-400/[0.06]', tag: 'bg-violet-400/20 text-violet-400', hex: '#A78BFA' },
  C: { letter: 'text-amber-400',  border: 'border-amber-400/50',  bg: 'bg-amber-400/[0.06]',  tag: 'bg-amber-400/20 text-amber-400',   hex: '#FBB134' },
  D: { letter: 'text-coral',      border: 'border-coral/50',      bg: 'bg-coral/[0.06]',      tag: 'bg-coral/20 text-coral',           hex: '#FF6B6B' },
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

// ─── Share card — estética vintage / Nike ────────────────────────────────────

async function buildShareCanvas(
  state: GameState,
  rank: string,
  awards: AwardInfo,
  drafts: Draft[],
): Promise<HTMLCanvasElement> {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const hex = (RANK_STYLES[rank] ?? RANK_STYLES['B']).hex;
  const BG  = '#050B17';

  // ── Background ───────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Grain
  for (let i = 0; i < 18000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
  }

  // ── Double border ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = hex;
  ctx.lineWidth   = 4;
  ctx.strokeRect(32, 32, W - 64, H - 64);
  ctx.strokeStyle = hex + '1C';
  ctx.lineWidth   = 1;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // ── Header ────────────────────────────────────────────────────────────────────
  ctx.font        = '900 66px Arial Black, Arial, sans-serif';
  ctx.fillStyle   = '#FFFFFF';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ALCANCE O TOPO', W / 2, 116);

  ctx.fillStyle = hex;
  ctx.fillRect(32, 132, W - 64, 4);

  ctx.font      = '600 18px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + '88';
  ctx.fillText('FUTEBOL HISTÓRICO BRASILEIRO', W / 2, 168);

  // ── Rank — dupla camada (efeito offset de impressão gráfica) ─────────────────
  // Camada fantasma levemente deslocada
  ctx.font      = '900 500px Arial Black, Arial, sans-serif';
  ctx.fillStyle = hex + '09';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(rank, W / 2 + 7, 676);

  // Camada sólida
  ctx.fillStyle = hex;
  ctx.fillText(rank, W / 2, 670);

  // Faixa label do rank
  ctx.fillStyle = hex + '16';
  ctx.fillRect(32, 682, W - 64, 54);
  ctx.font      = '700 34px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((RANK_LABELS[rank] ?? '').toUpperCase(), W / 2, 709);

  // ── Speed slash (duas listras diagonais) ──────────────────────────────────────
  const slashY = 746;
  ctx.save();
  ctx.fillStyle = hex;
  ctx.translate(W / 2, slashY);
  ctx.rotate(-0.02);
  ctx.fillRect(-W / 2 - 20, -5, W + 40, 10);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = hex + '36';
  ctx.translate(W / 2, slashY + 18);
  ctx.rotate(-0.02);
  ctx.fillRect(-W / 2 - 20, -3, W + 40, 5);
  ctx.restore();

  // ── Stats bar (bloco dourado sólido) ─────────────────────────────────────────
  const statsY = 772, statsH = 144;
  ctx.fillStyle = hex;
  ctx.fillRect(32, statsY, W - 64, statsH);

  const statItems = [
    { label: 'PTS', value: state.pts },
    { label: 'V',   value: state.v   },
    { label: 'E',   value: state.e   },
    { label: 'D',   value: state.d   },
    { label: 'GF',  value: state.gf  },
  ];
  const sw = (W - 64) / statItems.length;
  statItems.forEach((s, i) => {
    const sx = 32 + i * sw + sw / 2;
    ctx.font = '900 62px Arial Black, Arial, sans-serif';
    ctx.fillStyle = BG;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(s.value), sx, statsY + 96);
    ctx.font = '700 20px Arial, Helvetica, sans-serif';
    ctx.fillStyle = BG + 'AA';
    ctx.fillText(s.label, sx, statsY + 130);
    if (i < statItems.length - 1) {
      ctx.fillStyle = BG + '28';
      ctx.fillRect(32 + (i + 1) * sw - 1, statsY + 18, 2, statsH - 36);
    }
  });

  // ── Escalação ─────────────────────────────────────────────────────────────────
  const squadLabelY = 944;
  ctx.font      = '700 16px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + '80';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('E S C A L A Ç Ã O', W / 2, squadLabelY);
  ctx.fillStyle = hex + '26';
  ctx.fillRect(32, squadLabelY + 8, W - 64, 1);

  const sorted = [...drafts].filter(d => d.player).sort((a, b) => a.slot_index - b.slot_index);
  const rowH   = 46;
  const rowStart = squadLabelY + 18;

  sorted.forEach((d, i) => {
    const ry = rowStart + i * rowH;

    if (i % 2 === 0) {
      ctx.fillStyle = hex + '06';
      ctx.fillRect(32, ry, W - 64, rowH);
    }

    // Badge posição
    ctx.fillStyle = hex + '20';
    ctx.fillRect(48, ry + 5, 64, 36);
    ctx.font        = '700 17px Arial, Helvetica, sans-serif';
    ctx.fillStyle   = hex;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.slot_pos, 80, ry + rowH / 2);

    // Nome completo (caps)
    ctx.font        = '700 24px Arial Black, Arial, sans-serif';
    ctx.fillStyle   = 'rgba(245,240,232,0.88)';
    ctx.textAlign   = 'left';
    ctx.fillText(d.player!.name.toUpperCase(), 126, ry + rowH / 2);

    // Overall
    ctx.font        = '600 20px Arial, Helvetica, sans-serif';
    ctx.fillStyle   = hex + '90';
    ctx.textAlign   = 'right';
    ctx.fillText(String(d.player!.overall), W - 48, ry + rowH / 2);

    // Separador
    ctx.fillStyle = hex + '0E';
    ctx.fillRect(32, ry + rowH - 1, W - 64, 1);
  });

  // ── Prêmios ───────────────────────────────────────────────────────────────────
  const awardStartY = rowStart + sorted.length * rowH + 50;
  ctx.font      = '700 16px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + '80';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('P R Ê M I O S', W / 2, awardStartY);
  ctx.fillStyle = hex + '26';
  ctx.fillRect(32, awardStartY + 8, W - 64, 1);

  const awardList = [
    {
      icon: '⚽',
      label: 'ARTILHEIRO',
      value: awards.artilheiro
        ? `${awards.artilheiro.name.split(' ').at(-1)!.toUpperCase()} · ${awards.artilheiro.goals} GOLS`
        : '—',
    },
    {
      icon: '⭐',
      label: 'CRAQUE',
      value: awards.craque
        ? `${awards.craque.name.split(' ').at(-1)!.toUpperCase()} · ${awards.craque.ovr} OVR`
        : '—',
    },
    {
      icon: '🧤',
      label: 'GOLEIRO',
      value: awards.goleiro
        ? `${awards.goleiro.name.split(' ').at(-1)!.toUpperCase()} · ${awards.goleiro.cleanSheets} LIMPOS`
        : '—',
    },
  ];

  const awardRowH = 72;
  awardList.forEach((a, i) => {
    const ay = awardStartY + 20 + i * awardRowH;
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.icon, 52, ay + awardRowH / 2);

    ctx.font      = '600 16px Arial, Helvetica, sans-serif';
    ctx.fillStyle = hex + 'AA';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(a.label, 96, ay + 26);

    ctx.font      = '700 28px Arial Black, Arial, sans-serif';
    ctx.fillStyle = 'rgba(245,240,232,0.90)';
    ctx.fillText(a.value, 96, ay + 62);

    ctx.fillStyle = hex + '10';
    ctx.fillRect(32, ay + awardRowH - 1, W - 64, 1);
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  ctx.font      = '400 22px Arial, Helvetica, sans-serif';
  ctx.fillStyle = hex + '50';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('alcanceotopobrasil.com.br', W / 2, H - 54);

  return canvas;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultadoPage() {
  const router = useRouter();
  const [state, setState]         = useState<GameState | null>(null);
  const [rank, setRank]           = useState('');
  const [destaque, setDestaque]   = useState<Draft | null>(null);
  const [allDrafts, setAllDrafts] = useState<Draft[]>([]);
  const [awards, setAwards]       = useState<AwardInfo>({ artilheiro: null, goleiro: null, craque: null });
  const [saved, setSaved]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) { router.push('/'); return; }
    const gs: GameState = JSON.parse(raw);
    setState(gs);
    setRank(calculateRanking(gs.pts));

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

      const best = drafts.reduce<Draft | null>((prev, curr) =>
        (curr.player?.overall ?? 0) > (prev?.player?.overall ?? 0) ? curr : prev, null);
      setDestaque(best);

      for (const d of drafts) {
        if (d.player && goalMap.has(d.player.name)) {
          goalMap.set(d.player.name, { ...goalMap.get(d.player.name)!, team: d.player.team });
        }
      }
      const topScorer = Array.from(goalMap.entries()).sort((a, b) => b[1].goals - a[1].goals)[0];
      const gkDraft   = drafts.find(d => d.slot_pos === 'GK');

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
        artilheiro: topScorer ? { name: topScorer[0], goals: topScorer[1].goals, team: topScorer[1].team } : null,
        goleiro:    gkDraft?.player ? { name: gkDraft.player.name, cleanSheets, team: gkDraft.player.team } : null,
        craque:     bestPerf?.d.player ? { name: bestPerf.d.player.name, ovr: bestPerf.d.player.overall, team: bestPerf.d.player.team, era: bestPerf.d.player.era } : null,
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
      destaque_overall:   destaque.player?.overall ?? state.teamOverall,
      pts: state.pts, v: state.v, e: state.e, d: state.d, gf: state.gf, gc: state.gc,
    }).catch(() => null);
  }, [state, rank, saved, destaque]);

  // ── Share handlers ────────────────────────────────────────────────────────────

  async function handleGeneratePreview() {
    if (!state || !rank || generating) return;
    setGenerating(true);
    try {
      const canvas = await buildShareCanvas(state, rank, awards, allDrafts);
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewBlobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
      }, 'image/png');
    } finally {
      setGenerating(false);
    }
  }

  async function handleShareFromPreview() {
    const blob = previewBlobRef.current;
    if (!blob || !state) return;
    const file = new File([blob], 'minha-campanha-rtt.png', { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Alcance o Topo · Rank ${rank}`,
          text: `Terminei minha campanha com ${state.pts} pts e rank ${rank}! 🏆`,
        });
      } else {
        handleDownload();
      }
    } catch { /* cancelled */ }
  }

  function handleDownload() {
    const blob = previewBlobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = 'minha-campanha-rtt.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    previewBlobRef.current = null;
  }

  function handlePlayAgain() {
    localStorage.removeItem(GAME_STATE_KEY);
    router.push('/');
  }

  if (!state) return null;

  const style    = RANK_STYLES[rank] ?? RANK_STYLES['B'];
  const hasAwards = awards.artilheiro || awards.craque || awards.goleiro;

  return (
    <div className="min-h-screen bg-midnight flex flex-col relative z-10">

      {/* ── Preview modal ─────────────────────────────────────────────────────── */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-midnight flex flex-col">

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gold/15 shrink-0">
            <button
              onClick={handleClosePreview}
              className="text-[9px] tracking-[0.4em] uppercase font-bold text-cream/30 hover:text-cream/70 transition-colors"
            >
              ← Voltar
            </button>
            <span className="text-[9px] tracking-[0.4em] uppercase font-bold text-gold/60">
              Prévia da Campanha
            </span>
            <div className="w-16" />
          </div>

          {/* Imagem */}
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/60 px-6 py-4">
            <img
              src={previewUrl}
              alt="Prévia da campanha"
              className="h-full w-auto object-contain"
              style={{ filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.85))' }}
            />
          </div>

          {/* Ações */}
          <div className="px-6 py-6 flex flex-col gap-3 border-t border-gold/15 shrink-0 bg-midnight">
            <button
              onClick={handleShareFromPreview}
              className="w-full py-4 bg-gold text-midnight font-black uppercase tracking-[0.25em] text-sm hover:bg-gold/90 transition-colors"
            >
              ↑ Compartilhar
            </button>
            <button
              onClick={handleDownload}
              className="w-full py-3.5 border border-cream/15 text-cream/50 font-black uppercase tracking-widest text-sm hover:border-gold/40 hover:text-cream/70 transition-colors"
            >
              ↓ Baixar Imagem
            </button>
          </div>

        </div>
      )}

      {/* ── Header da página ──────────────────────────────────────────────────── */}
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

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
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

        {/* Prêmios */}
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

        {/* Ações */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={handleGeneratePreview}
            disabled={generating}
            className={`w-full py-3.5 border-2 font-black text-sm tracking-[0.25em] uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              generating
                ? 'border-cream/10 text-cream/25 cursor-not-allowed'
                : `${style.border} ${style.letter} hover:bg-white/[0.03]`
            }`}
          >
            {generating ? 'Gerando...' : '◆ Gerar Cartão'}
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
