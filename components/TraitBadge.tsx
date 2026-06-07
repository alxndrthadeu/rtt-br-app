const TRAIT_CONFIG: Record<string, { label: string; color: string }> = {
  matador:   { label: 'MATADOR',   color: 'bg-coral/20 text-coral border-coral/40' },
  camisa10:  { label: 'CAMISA 10', color: 'bg-gold/20 text-gold border-gold/40' },
  xerife:    { label: 'XERIFE',    color: 'bg-sky-400/15 text-sky-400 border-sky-400/35' },
  driblador: { label: 'DRIBLADOR', color: 'bg-violet-400/15 text-violet-400 border-violet-400/35' },
  paredao:   { label: 'PAREDÃO',   color: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/35' },
  motor:     { label: 'MOTOR',     color: 'bg-amber-600/15 text-amber-500 border-amber-500/35' },
  tecnico:   { label: 'TÉCNICO',   color: 'bg-teal-400/15 text-teal-400 border-teal-400/35' },
  capitao:   { label: 'CAPITÃO',   color: 'bg-blue-400/15 text-blue-400 border-blue-400/35' },
  estrela:   { label: 'ESTRELA',   color: 'bg-yellow-300/15 text-yellow-300 border-yellow-300/35' },
};

export default function TraitBadge({ trait, size = 'sm' }: { trait: string; size?: 'xs' | 'sm' }) {
  const cfg = TRAIT_CONFIG[trait];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center border font-black uppercase tracking-[0.25em] rounded-sm ${cfg.color} ${size === 'xs' ? 'text-[7px] px-1 py-px' : 'text-[8px] px-1.5 py-0.5'}`}>
      {cfg.label}
    </span>
  );
}
