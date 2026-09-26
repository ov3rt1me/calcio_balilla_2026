import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { useStore } from './store'
import { STAGE_LABEL, fmtDate, playerStats, standings, winnerId } from './tournament'
import Crest from './Crest'
import Figurina from './Figurina'
import MatchEditor from './MatchEditor'
import { Empty } from './ui'

export default function MatchSheet() {
  const { id } = useParams()
  const { matches, teams, players, teamsById, playersById, settings, isAdmin } = useStore()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef()
  const m = matches.find((x) => x.id === id)
  const { stats } = useMemo(() => playerStats(players, teams, matches), [players, teams, matches])
  const pos = useMemo(() => Object.fromEntries(standings(teams, matches).map((r) => [r.team.id, r])), [teams, matches])

  if (!m) return <Empty icon="🔎" title="Partita non trovata"><Link to="/calendario" className="text-lime underline">Torna al calendario</Link></Empty>
  const home = teamsById[m.home_id], away = teamsById[m.away_id]
  const w = winnerId(m)
  const prev = matches.filter((x) => x.id !== m.id && x.played && home && away &&
    [x.home_id, x.away_id].includes(home.id) && [x.home_id, x.away_id].includes(away.id))

  async function download() {
    setBusy(true)
    try {
      const url = await toPng(ref.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#070b1a' })
      const a = document.createElement('a')
      a.href = url
      a.download = `${home?.short || 'casa'}-${away?.short || 'ospiti'}.png`
      a.click()
    } catch (e) {
      window.dispatchEvent(new CustomEvent('app-error', { detail: 'Esportazione immagine non riuscita: ' + (e.message || e) }))
    } finally { setBusy(false) }
  }

  const Side = ({ t, align }) => (
    <div className={`flex flex-col items-center gap-3 text-center ${w && t && w !== t.id ? 'opacity-60' : ''}`}>
      <Crest crest={t?.crest} short={t?.short} size={96} />
      <div className="font-display text-3xl leading-none sm:text-4xl">{t?.name || 'Da definire'}</div>
      {t && pos[t.id] && m.stage === 'group' && <div className="text-xs text-white/50">{pos[t.id].pos}° · {pos[t.id].pt} pt</div>}
      {t && (
        <div className={`flex gap-2 sm:gap-3 ${align}`}>
          {[['ATT', t.attacker_id], ['DIF', t.defender_id]].map(([r, pid]) => (
            <div key={pid} className="relative">
              <Figurina player={playersById[pid]} team={t} role={r} size="sm" stats={stats[pid]} />
              {m.scorers?.[pid] > 0 && <div className="absolute -right-2 -top-2 rounded-full bg-lime px-2 py-0.5 text-xs font-bold text-pitch-950">⚽ {m.scorers[pid]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/calendario" className="text-sm text-white/60 hover:text-white">← Calendario</Link>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={download} disabled={busy}>📸 {busy ? 'Creo…' : 'Scarica immagine'}</button>
          {isAdmin && <button className="btn-primary" onClick={() => setEditing(true)}>{m.played ? 'Modifica risultato' : 'Inserisci risultato'}</button>}
        </div>
      </div>

      <div ref={ref} className="overflow-hidden rounded-3xl border border-white/10 bg-pitch-950"
        style={{ backgroundImage: `linear-gradient(110deg, ${home?.crest?.primary || '#222'}66, transparent 40%, transparent 60%, ${away?.crest?.primary || '#222'}66)` }}>
        <div className="flex items-center justify-between border-b border-white/10 bg-black/30 px-5 py-3">
          <div className="font-display text-xl tracking-widest text-lime">{settings.name}</div>
          <div className="text-right text-xs font-semibold uppercase tracking-widest text-white/60">
            {STAGE_LABEL[m.stage]}{m.stage === 'group' ? ` · Giornata ${m.round}` : ''}
          </div>
        </div>
        <div className="grid items-start gap-6 px-4 py-8 sm:grid-cols-[1fr_auto_1fr] sm:px-8">
          <Side t={home} align="justify-center" />
          <div className="flex flex-col items-center gap-2 self-center">
            {m.played ? (
              <div className="font-display text-7xl leading-none tracking-wider sm:text-8xl">{m.home_score}<span className="mx-2 text-white/30">-</span>{m.away_score}</div>
            ) : <div className="font-display text-6xl text-white/30">VS</div>}
            <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${m.played ? 'bg-white text-pitch-950' : 'bg-white/10 text-white/60'}`}>{m.played ? 'Terminata' : 'Da giocare'}</div>
            <div className="mt-2 text-center text-sm text-white/70">{fmtDate(m.scheduled_at, { weekday: 'long', year: 'numeric' })}</div>
            {m.location && <div className="text-sm text-white/50">📍 {m.location}</div>}
          </div>
          <Side t={away} align="justify-center" />
        </div>
        {(m.notes || prev.length > 0) && (
          <div className="grid gap-4 border-t border-white/10 bg-black/20 px-6 py-4 text-sm sm:grid-cols-2">
            {m.notes && <div><div className="label">Cronaca</div><p className="whitespace-pre-line text-white/80">{m.notes}</p></div>}
            {prev.length > 0 && <div><div className="label">Precedenti</div>{prev.map((x) => <div key={x.id} className="text-white/70">{teamsById[x.home_id]?.short} {x.home_score}-{x.away_score} {teamsById[x.away_id]?.short} · {STAGE_LABEL[x.stage]}</div>)}</div>}
          </div>
        )}
      </div>
      {editing && <MatchEditor match={m} onClose={() => setEditing(false)} />}
    </div>
  )
}
