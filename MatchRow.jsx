import { Link } from 'react-router-dom'
import { useStore } from './store'
import { fmtDate, winnerId } from './tournament'
import { TeamName } from './ui'

export default function MatchRow({ match: m, onEdit, placeholder }) {
  const { teamsById, isAdmin } = useStore()
  const w = winnerId(m)
  const home = teamsById[m.home_id], away = teamsById[m.away_id]
  return (
    <div className="flex flex-col gap-2 border-b border-white/5 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-40 shrink-0 text-xs text-white/50">
        <div className={m.scheduled_at ? 'font-semibold text-white/80' : 'italic'}>{fmtDate(m.scheduled_at)}</div>
        {m.location && <div className="truncate">{m.location}</div>}
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
        <div className={`flex min-w-0 justify-end ${w && w !== m.home_id ? 'opacity-50' : ''}`}>
          {home ? <TeamName team={home} size={24} className="flex-row-reverse text-right" /> : <span className="italic text-white/40">{placeholder?.[0] || 'Da definire'}</span>}
        </div>
        <Link to={`/partita/${m.id}`} className={`rounded-lg px-3 py-1 text-center font-display text-2xl tracking-wider ${m.played ? 'bg-white text-pitch-950' : 'bg-white/10 text-white/50'} hover:ring-2 hover:ring-lime`}>
          {m.played ? `${m.home_score} - ${m.away_score}` : 'vs'}
        </Link>
        <div className={`flex min-w-0 ${w && w !== m.away_id ? 'opacity-50' : ''}`}>
          {away ? <TeamName team={away} size={24} /> : <span className="italic text-white/40">{placeholder?.[1] || 'Da definire'}</span>}
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        <Link to={`/partita/${m.id}`} className="btn-ghost px-3 py-1 text-sm">Scheda</Link>
        {isAdmin && <button className="btn-primary px-3 py-1 text-sm" onClick={() => onEdit(m)}>{m.played ? 'Modifica' : 'Risultato'}</button>}
      </div>
    </div>
  )
}
