import type { DraftSlot } from '@/types';

interface Props {
  formation: string;
  slots: DraftSlot[];
  currentSlotIndex: number;
  difficulty: 'classico' | 'almanaque';
  compatibleSlots?: number[];
  onSlotClick?: (index: number) => void;
}

const FIELD_POSITIONS: Record<string, Array<{ x: number; y: number }>> = {
  // 4-4-2: GK · 4 def · 4 mei flat · 2 CA
  '4-4-2': [
    { x: 50, y: 88 },                                                             // GK
    { x: 63, y: 72 }, { x: 37, y: 72 },                                          // ZAG ZAG
    { x: 83, y: 72 }, { x: 17, y: 72 },                                          // LD LE
    { x: 17, y: 45 }, { x: 39, y: 45 }, { x: 61, y: 45 }, { x: 83, y: 45 },    // MEI MEI MEI MEI
    { x: 37, y: 15 }, { x: 63, y: 15 },                                          // CA CA
  ],
  // 4-3-3: GK · 4 def · 3 MEI · PE CA PD (pontas altas e abertas)
  '4-3-3': [
    { x: 50, y: 88 },                                                             // GK
    { x: 63, y: 72 }, { x: 37, y: 72 },                                          // ZAG ZAG
    { x: 83, y: 72 }, { x: 17, y: 72 },                                          // LD LE
    { x: 25, y: 50 }, { x: 50, y: 47 }, { x: 75, y: 50 },                       // MEI MEI MEI
    { x: 17, y: 22 }, { x: 83, y: 22 },                                          // PE PD (pontas abertas)
    { x: 50, y: 12 },                                                             // CA
  ],
  // 3-5-2: GK · 3 ZAG · LD/LE avançados · 3 MEI centrais · 2 CA
  '3-5-2': [
    { x: 50, y: 88 },                                                             // GK
    { x: 65, y: 72 }, { x: 50, y: 70 }, { x: 35, y: 72 },                       // ZAG ZAG ZAG
    { x: 88, y: 38 }, { x: 12, y: 38 },                                          // LD LE (wing-backs avançados)
    { x: 34, y: 52 }, { x: 50, y: 50 }, { x: 66, y: 52 },                       // MEI MEI MEI
    { x: 37, y: 15 }, { x: 63, y: 15 },                                          // CA CA
  ],
  // 4-2-3-1: GK · 4 def · 2 pivôs · trio ofensivo na mesma linha · 1 CA
  '4-2-3-1': [
    { x: 50, y: 88 },                                                             // GK
    { x: 63, y: 72 }, { x: 37, y: 72 },                                          // ZAG ZAG
    { x: 83, y: 72 }, { x: 17, y: 72 },                                          // LD LE
    { x: 37, y: 58 }, { x: 63, y: 58 },                                          // MEI MEI (dupla pivô)
    { x: 50, y: 32 },                                                             // MEI (CAM)
    { x: 17, y: 32 }, { x: 83, y: 32 },                                          // PE PD (mesma linha do CAM)
    { x: 50, y: 12 },                                                             // CA
  ],
};

const W = 200;
const H = 280;

export default function FootballField({ formation, slots, currentSlotIndex, difficulty, compatibleSlots = [], onSlotClick }: Props) {
  const positions = FIELD_POSITIONS[formation] ?? FIELD_POSITIONS['4-4-2'];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Field stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x="0" y={i * 28} width={W} height="28"
          fill={i % 2 === 0 ? '#4A7F58' : '#3D7048'}
        />
      ))}

      {/* Outer border — gold tint for vintage card feel */}
      <rect x="6" y="6" width={W - 12} height={H - 12}
        fill="none" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" />

      {/* Center line */}
      <line x1="6" y1={H / 2} x2={W - 6} y2={H / 2}
        stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Center circle */}
      <circle cx={W / 2} cy={H / 2} r="28"
        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <circle cx={W / 2} cy={H / 2} r="2"
        fill="rgba(255,255,255,0.3)" />

      {/* Top penalty box */}
      <rect x="55" y="6" width="90" height="44"
        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Top goal area */}
      <rect x="78" y="6" width="44" height="18"
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Bottom penalty box */}
      <rect x="55" y={H - 50} width="90" height="44"
        fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Bottom goal area */}
      <rect x="78" y={H - 24} width="44" height="18"
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Players */}
      {slots.map((slot, i) => {
        const p = positions[i];
        if (!p) return null;
        const cx = (p.x / 100) * W;
        const cy = (p.y / 100) * H;
        const filled = slot.player !== null;
        const isCompatible = compatibleSlots.includes(i);
        const isClickable = isCompatible && !filled && !!onSlotClick;

        return (
          <g
            key={i}
            onClick={() => isClickable && onSlotClick(i)}
            style={{ cursor: isClickable ? 'pointer' : 'default' }}
          >
            {/* Pulse ring for compatible slots */}
            {isCompatible && !filled && (
              <circle cx={cx} cy={cy} r="17" fill="rgba(212,75,42,0.15)" stroke="#D44B2A" strokeWidth="1" strokeDasharray="3 2" />
            )}

            <circle
              cx={cx} cy={cy} r="13"
              fill={filled ? '#EDE8DC' : isCompatible ? 'rgba(212,75,42,0.35)' : 'rgba(255,255,255,0.07)'}
              stroke={isCompatible ? '#D44B2A' : filled ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.35)'}
              strokeWidth={isCompatible ? '2.5' : '1.5'}
              strokeDasharray={filled || isCompatible ? '0' : '4 2'}
            />

            <text
              x={cx} y={cy + 1}
              textAnchor="middle" dominantBaseline="middle"
              fill={filled ? '#0B1929' : isCompatible ? '#D44B2A' : 'rgba(237,232,220,0.8)'}
              fontSize="7" fontWeight="bold"
            >
              {filled
                ? (difficulty === 'classico' ? String(slot.player!.overall) : slot.slot_pos)
                : slot.slot_pos}
            </text>

            {filled && (
              <text
                x={cx} y={cy + 21}
                textAnchor="middle"
                fill="rgba(237,232,220,0.9)"
                fontSize="6.5"
                fontWeight="600"
              >
                {getShortName(slot.player!.name)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function getShortName(name: string): string {
  const parts = name.trim().split(' ');
  const last = parts[parts.length - 1];
  if (last.length <= 10) return last;
  return last.substring(0, 9) + '.';
}
