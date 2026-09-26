import { useEffect, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useStore } from './store'
import { playerStats, standings } from './tournament'
import Crest from './Crest'
import Figurina from './Figurina'
import { Empty, PageHeader } from './ui'

export default function Teams() {
  const { teams, players, matches, playersById } = useStore()
  const { hash } = useLocation()
  const { stats } = useMemo(() => playerStats(players, teams, matches), [players, teams, matches])
  const table = useMemo(() => Object.fromEntries(standings(teams, matches).map((r) => [r.team.id, r])), [teams, matches])
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [hash, teams.length])

  if (!teams.length) return <Empty icon="🛡️" title="Nessuna squadra">Le squadre nascono dal <Link to="/sorteggio" className="text-lime underline">sorteggio</Link>.</Empty>
  return (
    <div>
      <PageHeader kicker={`${teams.length} club`} title="Le squadre" />
      <div className="grid gap-5 md:grid-cols-2">
        {teams.map((t) => {
          const r = table[t.id]
          return (
            <div id={t.id} key={t.id} className={`card overflow-hidden ${hash === '#' + t.id ? 'ring-2 ring-lime' : ''}`}
              style={{ backgroundImage: `linear-gradient(135deg, ${t.crest?.primary}55, transparent 55%)` }}>
              <div className="flex items-center gap-4 p-5">
                <Crest crest={t.crest} short={t.short} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-4xl leading-none tracking-wide">{t.name}</div>
                  {r && <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                    <span><b className="text-lime">{r.pos}°</b> in classifica</span><span><b className="text-white">{r.pt}</b> punti</span>
                    <span>{r.v}V {r.n ? `${r.n}N ` : ''}{r.p}P</span><span>GF {r.gf} · GS {r.gs}</span>
                  </div>}
                </div>
              </div>
              <div className="flex justify-center gap-4 bg-black/20 p-5">
                <Figurina player={playersById[t.attacker_id]} team={t} role="ATT" stats={stats[t.attacker_id]} />
                <Figurina player={playersById[t.defender_id]} team={t} role="DIF" stats={stats[t.defender_id]} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
