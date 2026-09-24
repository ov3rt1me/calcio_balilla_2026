import { useId } from 'react'

const SHAPES = {
  shield: 'M50 4 L94 16 V58 C94 88 72 106 50 116 C28 106 6 88 6 58 V16 Z',
  classic: 'M10 6 H90 V60 C90 90 70 106 50 114 C30 106 10 90 10 60 Z',
  round: 'M50 12 A48 48 0 1 1 49.9 12 Z',
  hex: 'M50 4 L94 30 V90 L50 116 L6 90 V30 Z',
}

function Pattern({ pattern, c }) {
  switch (pattern) {
    case 'stripes': return [18, 42, 66].map((x) => <rect key={x} x={x} y="0" width="12" height="120" fill={c} />)
    case 'half': return <rect x="50" y="0" width="50" height="120" fill={c} />
    case 'hoops': return [20, 48, 76, 104].map((y) => <rect key={y} x="0" y={y} width="100" height="13" fill={c} />)
    case 'sash': return <polygon points="0,20 20,0 100,90 100,120 85,120 0,35" fill={c} />
    case 'chevron': return <polygon points="0,30 50,70 100,30 100,52 50,92 0,52" fill={c} />
    case 'quarters': return <><rect x="50" y="0" width="50" height="60" fill={c} /><rect x="0" y="60" width="50" height="60" fill={c} /></>
    default: return null
  }
}

function Icon({ icon, color }) {
  const p = { fill: color, stroke: 'none' }
  switch (icon) {
    case 'star': return <polygon {...p} points="0,-11 3,-3.5 11,-3.4 4.8,1.6 7,9.5 0,5 -7,9.5 -4.8,1.6 -11,-3.4 -3,-3.5" />
    case 'bolt': return <polygon {...p} points="3,-12 -7,2 -1,2 -4,12 7,-3 1,-3" />
    case 'crown': return <path {...p} d="M-10 6 L-11 -6 L-5 -1 L0 -9 L5 -1 L11 -6 L10 6 Z" />
    case 'rod': return <g {...p}><rect x="-12" y="-1.5" width="24" height="3" rx="1.5" /><rect x="-3.5" y="-9" width="7" height="12" rx="2" /><circle cx="0" cy="-11" r="3" /><rect x="-2.5" y="3" width="5" height="7" rx="1" /></g>
    default: return <g><circle r="10" fill="#fff" stroke={color} strokeWidth="1.6" /><polygon fill={color} points="0,-4.5 4.3,-1.4 2.6,3.6 -2.6,3.6 -4.3,-1.4" /><path d="M0-4.5V-10M4.3-1.4L9.3-3M2.6 3.6L5.6 8M-2.6 3.6L-5.6 8M-4.3-1.4L-9.3-3" stroke={color} strokeWidth="1.3" /></g>
  }
}

export default function Crest({ crest, short, size = 48, className = '' }) {
  const id = useId().replace(/:/g, '')
  const c = crest || { shape: 'shield', pattern: 'plain', icon: 'ball', primary: '#334155', secondary: '#64748b', accent: '#fff' }
  const d = SHAPES[c.shape] || SHAPES.shield
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} className={className} aria-hidden="true">
      <defs><clipPath id={`c${id}`}><path d={d} /></clipPath></defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="100" height="120" fill={c.primary} />
        <Pattern pattern={c.pattern} c={c.secondary} />
      </g>
      <path d={d} fill="none" stroke={c.accent} strokeWidth="4" />
      <circle cx="50" cy="62" r="19" fill={c.primary} stroke={c.accent} strokeWidth="3" />
      <g transform="translate(50 62) scale(1.15)"><Icon icon={c.icon} color={c.accent} /></g>
      {short && (
        <>
          <rect x="22" y="88" width="56" height="15" rx="3" fill={c.accent} />
          <text x="50" y="99.5" textAnchor="middle" fontFamily="Bebas Neue, Impact, sans-serif" fontSize="14" letterSpacing="1.5" fill={c.primary}>{short}</text>
        </>
      )}
    </svg>
  )
}
