import Crest from './Crest'
import { LEVELS } from '../lib/tournament'

const CARD = {
  gold: 'from-[#fff1b8] via-[#f5c542] to-[#a8740f] text-[#3b2a04]',
  silver: 'from-[#ffffff] via-[#cfd6e0] to-[#7d8796] text-[#1f2633]',
  bronze: 'from-[#ffd2a8] via-[#d68a4c] to-[#7a3e14] text-[#2f1604]',
}
const initials = (n = '') => n.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

/** Figurina del giocatore. size: 'sm' | 'md' | 'lg' */
export default function Figurina({ player, team, stats, size = 'md', role, className = '' }) {
  if (!player) return null
  const lvl = LEVELS[player.level] || LEVELS[3]
  const w = { sm: 120, md: 170, lg: 230 }[size]
  const r = role || player.role
  return (
    <div
      className={`relative shrink-0 select-none overflow-hidden rounded-2xl bg-gradient-to-br p-[5px] shadow-xl shadow-black/40 ${CARD[lvl.card]} ${className}`}
      style={{ width: w, height: w * 1.42 }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-black/10 bg-gradient-to-b from-white/35 to-black/10">
        <div className="flex items-start justify-between px-2 pt-1.5">
          <div className="leading-none">
            <div className="font-display" style={{ fontSize: w * 0.2 }}>{r}</div>
            <div className="mt-0.5 tracking-tighter" style={{ fontSize: w * 0.075 }}>{'★'.repeat(lvl.stars)}<span className="opacity-25">{'★'.repeat(3 - lvl.stars)}</span></div>
          </div>
          {team && <Crest crest={team.crest} size={w * 0.2} />}
        </div>
        <div className="relative mx-auto -mt-2 flex-1" style={{ width: w * 0.78 }}>
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="absolute inset-0 h-full w-full rounded-lg object-cover object-top" crossOrigin="anonymous" />
          ) : (
            <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/15 font-display opacity-70" style={{ fontSize: w * 0.3 }}>{initials(player.name)}</div>
          )}
        </div>
        <div className="bg-black/15 px-2 pb-1.5 pt-1 text-center">
          <div className="truncate font-display leading-none" style={{ fontSize: w * 0.14 }}>{player.name}</div>
          {player.nickname && <div className="truncate italic opacity-75" style={{ fontSize: w * 0.065 }}>“{player.nickname}”</div>}
          {stats && size !== 'sm' && (
            <div className="mt-1 flex justify-center gap-3 font-semibold" style={{ fontSize: w * 0.065 }}>
              <span>PG {stats.pg}</span><span>V {stats.v}</span><span>GOL {stats.gol}</span>
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.45)_48%,transparent_60%)] opacity-60 mix-blend-overlay" />
    </div>
  )
}
