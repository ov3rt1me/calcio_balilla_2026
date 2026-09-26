import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from './store'
import { standings } from './tournament'
import MatchRow from './MatchRow'
import MatchEditor from './MatchEditor'
import { TeamName } from './ui'

const STEPS = [
  ['🃏', 'Giocatori', 'Inserisci nome, ruolo, livello e foto per la figurina', '/giocatori'],
  ['🎲', 'Sorteggio', 'Calciomercato a fasce: le coppie si formano in diretta', '/sorteggio'],
  ['📅', 'Calendario', 'Girone all’italiana e date delle prenotazioni', '/calendario'],
  ['🏆', 'Classifica', 'Risultati, classifica, marcatori e fase finale', '/classifica'],
]

export default function Home() {
  const { settings, players, teams, matches, loading, isAdmin } = useStore()
  const [editing, setEditing] = useState(null)
  const table = useMemo(() => standings(teams, matches), [teams, matches])
  const next = matches.filter((m) => !m.played && m.home_id && m.away_id)
    .sort((a, b) => (a.scheduled_at ? new Date(a.scheduled_at) : Infinity) - (b.scheduled_at ? new Date(b.scheduled_at) : Infinity) || a.round - b.round).slice(0, 4)
  const last = matches.filter((m) => m.played).sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at)).slice(0, 4)
  const played = matches.filter((m) => m.played).length
  const done = [players.length >= 4, teams.length > 0, matches.length > 0, played > 0]

  if (loading) return <div className="py-20 text-center text-white/50">Caricamento…</div>

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 text-[220px] leading-none opacity-[.06]">⚽</div>
        <div className="text-xs font-bold uppercase tracking-[.3em] text-lime">Stagione {new Date().getFullYear()}</div>
        <h1 className="mt-2 font-display text-6xl leading-[.9] tracking-wide sm:text-8xl">{settings.name}</h1>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          {[[players.length, 'giocatori'], [teams.length, 'squadre'], [`${played}/${matches.length}`, 'partite giocate']].map(([n, l]) => (
            <div key={l}><div className="font-display text-4xl text-white">{n}</div><div className="text-white/50">{l}</div></div>
          ))}
        </div>
      </motion.section>

      {isAdmin && !done.every(Boolean) && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([icon, t, d, to], i) => (
            <Link key={to} to={to} className={`card p-4 transition hover:border-lime/50 ${done[i] ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between"><span className="text-2xl">{icon}</span><span className="text-xs font-bold text-white/40">{done[i] ? '✓ fatto' : `passo ${i + 1}`}</span></div>
              <div className="mt-2 font-display text-2xl tracking-wide">{t}</div>
              <div className="text-sm text-white/60">{d}</div>
            </Link>
          ))}
        </section>
      )}

      {teams.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <section>
              <div className="mb-2 flex items-baseline justify-between"><h2 className="font-display text-3xl tracking-wide">Prossime partite</h2><Link to="/calendario" className="text-sm text-lime">Calendario →</Link></div>
              <div className="card">{next.length ? next.map((m) => <MatchRow key={m.id} match={m} onEdit={setEditing} />) : <div className="p-4 text-sm text-white/50">Nessuna partita in programma.</div>}</div>
            </section>
            {last.length > 0 && (
              <section>
                <h2 className="mb-2 font-display text-3xl tracking-wide">Ultimi risultati</h2>
                <div className="card">{last.map((m) => <MatchRow key={m.id} match={m} onEdit={setEditing} />)}</div>
              </section>
            )}
          </div>
          <section>
            <div className="mb-2 flex items-baseline justify-between"><h2 className="font-display text-3xl tracking-wide">Classifica</h2><Link to="/classifica" className="text-sm text-lime">Completa →</Link></div>
            <div className="card">
              {table.slice(0, 8).map((r) => (
                <div key={r.team.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0">
                  <span className="w-5 font-display text-lg text-white/50">{r.pos}</span>
                  <div className="min-w-0 flex-1"><TeamName team={r.team} size={24} /></div>
                  <span className="text-xs text-white/40">{r.g} G</span>
                  <span className="w-8 text-right font-display text-2xl text-lime">{r.pt}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {editing && <MatchEditor match={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
