'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlayerUUID } from '@/hooks/usePlayerUUID';
import { FORMATIONS } from '@/lib/draft';

const MODES = [
  {
    id: 'classico' as const,
    title: 'Clássico',
    desc: 'Overall e estatísticas à vista. Monte o XI mais forte que puder.',
  },
  {
    id: 'almanaque' as const,
    title: 'Almanaque',
    desc: 'Stats ocultos — só nomes e posições. Para verdadeiros fãs.',
  },
];

function VintageDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gold/60 dark:bg-gold/40" />
      <p className="text-[10px] tracking-[0.45em] uppercase text-gold font-bold shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gold/60 dark:bg-gold/40" />
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const playerUUID = usePlayerUUID();
  const [mode, setMode] = useState<'classico' | 'almanaque' | null>(null);
  const [formation, setFormation] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-paper dark:bg-midnight flex flex-col transition-colors relative z-10">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gold/30 dark:border-gold/15">
        <Image src="/logo.png" alt="Alcance o Topo" width={34} height={34} className="object-contain" />
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/historico')}
            className="text-[9px] tracking-[0.4em] uppercase font-bold text-ink/70 dark:text-cream/30 hover:text-ink dark:hover:text-cream transition-colors"
          >
            Histórico →
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center py-14 px-6 gap-10">

        {/* Vintage title block */}
        <div className="flex flex-col items-center gap-5 text-center">
          {/* Logo with ornamental frame */}
          <div className="relative p-4">
            <div className="absolute inset-0 border-2 border-gold/70 dark:border-gold/50" />
            <div className="absolute inset-[6px] border border-gold/30 dark:border-gold/20" />
            <Image src="/logo.png" alt="logo" width={120} height={120} className="object-contain relative z-10" />
          </div>

          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-gold/60" />
              <p className="text-[8px] tracking-[0.6em] uppercase text-gold font-bold">
                Futebol Histórico Brasileiro
              </p>
              <div className="h-px w-8 bg-gold/60" />
            </div>

            <h1 className="text-[3.2rem] font-black text-ink dark:text-cream tracking-tight leading-none uppercase">
              Monte seu XI
            </h1>

            <p className="text-ink/70 dark:text-cream/40 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
              Escolha como jogar, defina a formação e sorteie seus 11 jogadores.
            </p>
          </div>
        </div>

        {/* Como Funciona */}
        <div className="w-full max-w-[600px] flex flex-col gap-5">
          <VintageDivider label="Como funciona" />

          <div className="grid grid-cols-1 gap-3">

            {/* Passo 1 */}
            <div className="relative border border-ink/15 dark:border-gold/15 bg-parchment dark:bg-navy p-4 flex gap-4 items-start">
              <div className="absolute inset-[3px] border border-ink/[0.04] dark:border-gold/[0.06] pointer-events-none" />
              <div className="shrink-0 w-8 h-8 border-2 border-gold/70 flex items-center justify-center">
                <span className="text-sm font-black text-gold leading-none">1</span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide text-ink dark:text-cream mb-0.5">
                  Monte seu esquema
                </p>
                <p className="text-[12px] text-ink/65 dark:text-cream/40 leading-relaxed">
                  Escolha o modo e a formação. A cada rodada, um clube histórico é sorteado — você escolhe 1 jogador daquele elenco para preencher uma posição.
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="relative border border-ink/15 dark:border-gold/15 bg-parchment dark:bg-navy p-4 flex gap-4 items-start">
              <div className="absolute inset-[3px] border border-ink/[0.04] dark:border-gold/[0.06] pointer-events-none" />
              <div className="shrink-0 w-8 h-8 border-2 border-gold/70 flex items-center justify-center">
                <span className="text-sm font-black text-gold leading-none">2</span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide text-ink dark:text-cream mb-0.5">
                  Use os rerolls com sabedoria
                </p>
                <p className="text-[12px] text-ink/65 dark:text-cream/40 leading-relaxed">
                  Você tem <strong className="text-ink dark:text-cream/80">3 rerolls</strong> por draft — use para trocar o clube sorteado. Uma vez gastos, não voltam.
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="relative border border-ink/15 dark:border-gold/15 bg-parchment dark:bg-navy p-4 flex gap-4 items-start">
              <div className="absolute inset-[3px] border border-ink/[0.04] dark:border-gold/[0.06] pointer-events-none" />
              <div className="shrink-0 w-8 h-8 border-2 border-gold/70 flex items-center justify-center">
                <span className="text-sm font-black text-gold leading-none">3</span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide text-ink dark:text-cream mb-0.5">
                  Traits fazem a diferença
                </p>
                <p className="text-[12px] text-ink/65 dark:text-cream/40 leading-relaxed">
                  Lendas têm traits especiais: <strong className="text-coral">MATADOR</strong> fura defesas, <strong className="text-gold">CAMISA 10</strong> cria jogadas (mas abre espaços), <strong className="text-sky-400">XERIFE</strong> e <strong className="text-emerald-400">PAREDÃO</strong> blindam a defesa, <strong className="text-amber-500">MOTOR</strong> equilibra o meio.
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="relative border border-ink/15 dark:border-gold/15 bg-parchment dark:bg-navy p-4 flex gap-4 items-start">
              <div className="absolute inset-[3px] border border-ink/[0.04] dark:border-gold/[0.06] pointer-events-none" />
              <div className="shrink-0 w-8 h-8 border-2 border-gold/70 flex items-center justify-center">
                <span className="text-sm font-black text-gold leading-none">4</span>
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-wide text-ink dark:text-cream mb-0.5">
                  38 rodadas, ranking final
                </p>
                <p className="text-[12px] text-ink/65 dark:text-cream/40 leading-relaxed">
                  Seu XI enfrenta os maiores times históricos do Brasileirão. O ranking vai de <strong className="text-gold">S — Campeão Histórico</strong> a <strong className="text-coral">D — Rebaixado</strong>. Faça 78+ pontos para entrar para a lenda.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Step 1: Mode */}
        <div className="w-full max-w-[600px] flex flex-col gap-5">
          <VintageDivider label="1 · Escolha o modo" />
          <div className="grid grid-cols-2 gap-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`relative p-5 text-left border-2 transition-all duration-150 ${
                  mode === m.id
                    ? 'border-gold bg-gold/10 dark:bg-gold/[0.08] shadow-[inset_0_0_0_1px_rgba(201,168,76,0.5)]'
                    : 'border-ink/20 dark:border-cream/10 bg-parchment dark:bg-navy hover:border-gold dark:hover:border-gold/30'
                }`}
              >
                {mode === m.id && (
                  <span className="absolute top-2 right-2.5 text-gold text-xs leading-none">◆</span>
                )}
                <p className="font-black text-[16px] text-ink dark:text-cream mb-1.5 uppercase tracking-wide leading-tight">
                  {m.title}
                </p>
                <p className="text-[13px] text-ink/70 dark:text-cream/45 leading-snug font-normal normal-case">
                  {m.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Formation */}
        {mode && (
          <div className="w-full max-w-[600px] flex flex-col gap-5">
            <VintageDivider label="2 · Escolha a formação" />
            <div className="grid grid-cols-4 gap-3">
              {Object.keys(FORMATIONS).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormation(f)}
                  className={`py-3.5 font-black text-[14px] tracking-widest border-2 transition-all duration-150 uppercase ${
                    formation === f
                      ? 'border-gold text-ink dark:text-cream bg-gold/10 dark:bg-gold/[0.08] shadow-[inset_0_0_0_1px_rgba(201,168,76,0.5)]'
                      : 'border-ink/20 dark:border-cream/10 bg-parchment dark:bg-navy text-ink/75 dark:text-cream/50 hover:border-gold dark:hover:border-gold/30 hover:text-ink dark:hover:text-cream/85'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {mode && formation && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <div className="relative">
              <div className="absolute -inset-1.5 border border-gold/40 dark:border-gold/25" />
              <button
                onClick={() => playerUUID && router.push(`/draft?difficulty=${mode}&formation=${formation}`)}
                disabled={!playerUUID}
                className="relative px-14 py-4 bg-gold text-midnight font-black text-sm tracking-[0.3em] uppercase disabled:opacity-40 hover:bg-gold/90 hover:shadow-[0_0_28px_rgba(201,168,76,0.55)] transition-all duration-200 border-2 border-gold"
              >
                Começar o Draft ◆
              </button>
            </div>
            <p className="text-[8px] tracking-[0.45em] uppercase text-ink/40 dark:text-cream/20">
              {mode === 'classico' ? 'Modo Clássico' : 'Modo Almanaque'} · {formation}
            </p>
          </div>
        )}

      </div>

      {/* Footer stamp */}
      <footer className="flex items-center justify-center py-4 gap-3 border-t border-gold/20">
        <div className="h-px w-8 bg-gold/40" />
        <span className="text-[8px] tracking-[0.5em] uppercase text-ink/40 dark:text-gold/35 font-bold">
          Alcance o Topo · Est. 2026
        </span>
        <div className="h-px w-8 bg-gold/40" />
      </footer>

    </main>
  );
}
