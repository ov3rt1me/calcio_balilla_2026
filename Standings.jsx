import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { generateKnockout } from '../lib/actions'
import { playerStats, standings, winnerId } from '../lib/tournament'
import { Empty, PageHeader, TeamName } from '../components/ui'

const FORM = { V: 'bg-lime text-pitch-950', N: 'bg-white/40 text-pitch-950', P: 'bg-magenta text-white' }

export default function Standings() {
  const store = useStore()
  const { teams, matches, players, isAdmin } = store
  const table = useMemo(() => standings(teams, matches), [teams, matches])
  const { stats, teamOf } = useMemo(() => playerStats(players, teams, matches), [players, teams, matches])
  const scorers = players.filter((p) => stats[p.id]?.gol > 0).sort((a, b) => stats[b.id].gol - stats[a.id].gol).slice(0, 10)
  const group = matches.filter((m) => m.stage === 'group')
  const qual = teams.length >= 4 ? 4 : 2
  const ko = Object.fromEntries(matches.filter((m) => m.slot).map((m) => [m.slot, m]))

  if (!teams.length) return <Empty icon="🏆" title="Classifica vuota">Prima serve il <Link to="/sorteggio" className="text-lime underline">sorteggio</Link>.</Empty>

  return (
    <div>
      <PageHeader kicker={`${group.filter((m) => m.played).length} di ${group.length} partite`} title="Classifica">
        {isAdmin && group.length > 0 && !ko.final && <button className="btn-ghost" onClick={() => generateKnockout(store)}>🏆 Genera fase finale</button>}
      </PageHeader>

      <div className="card mb-8 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/40">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3 text-left">#</th><th className="text-left">Squadra</th>
              <th title="Giocate">G</th><th title="Vinte">V</th><th title="Pareggiate">N</th><th title="Perse">P</th>
              <th title="Gol fatti">GF</th><th title="Gol subiti">GS</th><th title="Differenza reti">DR</th>
              <th className="text-lime">PT</th><th className="hidden pr-3 sm:table-cell">Forma</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r) => (
              <tr key={r.team.id} className="border-b border-white/5 text-center last:border-0">
                <td className="px-3 py-2.5 text-left"><span className={`inline-grid h-7 w-7 place-items-center rounded-md font-display text-lg ${r.pos <= qual ? 'bg-lime/20 text-lime' : 'text-white/50'}`}>{r.pos}</span></td>
                <td className="max-w-[220px] text-left"><TeamName team={r.team} /></td>
                <td>{r.g}</td><td>{r.v}</td><td>{r.n}</td><td>{r.p}</td><td>{r.gf}</td><td>{r.gs}</td>
                <td>{r.dr > 0 ? `+${r.dr}` : r.dr}</td>
                <td className="font-display text-xl text-lime">{r.pt}</td>
                <td className="hidden pr-3 sm:table-cell"><div className="flex justify-center gap-1">{r.form.map((f, i) => <span key={i} className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${FORM[f]}`}>{f}</span>)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-white/10 px-3 py-2 text-xs text-white/40">Vittoria 3 punti · pareggio 1 · a pari punti: differenza reti, scontro diretto, gol fatti. In verde le qualificate alla fase finale.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 font-display text-3xl tracking-wide text-gold">Fase finale</h2>
          {ko.final ? <Bracket ko={ko} /> : <div className="card p-5 text-sm text-white/60">Al termine del girone le prime {qual} si giocano {qual === 4 ? 'semifinali (1ª-4ª e 2ª-3ª) e finale' : 'la finale'}.</div>}
        </section>
        <section>
          <h2 className="mb-3 font-display text-3xl tracking-wide">Classifica marcatori</h2>
          <div className="card">
            {scorers.length ? scorers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-2 last:border-0">
                <span className="w-5 text-white/40">{i + 1}</span>
                {p.photo_url ? <img src={p.photo_url} className="h-8 w-8 rounded-full object-cover object-top" alt="" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs">{p.name[0]}</span>}
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.name}</div><div className="truncate text-xs text-white/40">{teamOf[p.id]?.name}</div></div>
                <span className="font-display text-2xl text-lime">{stats[p.id].gol}</span>
              </div>
            )) : <div className="p-4 text-sm text-white/50">Inserisci i gol dei singoli giocatori nei risultati per vedere i marcatori.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}

function KoBox({ m, label, ph }) {
  const { teamsById } = useStore()
  if (!m) return null
  const w = winnerId(m)
  return (
    <Link to={`/partita/${m.id}`} className="card block p-3 hover:border-lime/50">
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">{label}</div>
      {[['home_id', 'home_score', 0], ['away_id', 'away_score', 1]].map(([k, s, i]) => (
        <div key={k} className={`flex items-center justify-between gap-2 py-1 ${w && w !== m[k] ? 'opacity-40' : ''}`}>
          {teamsById[m[k]] ? <TeamName team={teamsById[m[k]]} link={false} size={24} /> : <span className="text-sm italic text-white/40">{ph?.[i] || 'Da definire'}</span>}
          <span className="font-display text-2xl">{m.played ? m[s] : ''}</span>
        </div>
      ))}
    </Link>
  )
}

function Bracket({ ko }) {
  const { teamsById } = useStore()
  const champ = teamsById[winnerId(ko.final)]
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      {ko.sf1 && <div className="space-y-4"><KoBox m={ko.sf1} label="Semifinale 1" /><KoBox m={ko.sf2} label="Semifinale 2" /></div>}
      <div className="space-y-4">
        <KoBox m={ko.final} label="🏆 Finale" ph={['Vincente SF1', 'Vincente SF2']} />
        {champ && (
          <div className="card border-gold/50 bg-gold/10 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[.3em] text-gold">Campioni</div>
            <div className="mt-2 flex justify-center"><TeamName team={champ} size={48} /></div>
          </div>
        )}
      </div>
    </div>
  )
}
