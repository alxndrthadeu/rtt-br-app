import { getEscudo } from '@/lib/escudos';

interface Props {
  team: string;
  size?: number;
  className?: string;
}

export default function TeamShield({ team, size = 32, className = '' }: Props) {
  const src = getEscudo(team);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={team}
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
