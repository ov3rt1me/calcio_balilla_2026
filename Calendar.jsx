import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from './store'
import { generateCalendar, generateKnockout } from './actions'
import { scheduleSlots } from './tournament'
import MatchRow from './MatchRow'
import MatchEditor from './MatchEditor'
import { Empty, Modal, PageHeader } from './ui'

const KO_PLACEHOLDER = { final: ['Vincente SF1', 'Vincente SF2'] }

export default function Calendar() {
  const store = useStore()
  const { teams, matches, isAdmin } = store
  const [editing, setEditing] = useState(null)
  const [dates, setDates] = useState(false)
  const [filter, setFilter] = useState('all')

  const group = matches.filter((m) => m.stage === 'group')
  const ko = matches.filter((m) => m.stage !== 'group').sort((a, b) => a.round - b.round || (a.slot || '').localeCompare(b.slot || ''))
  const groupDone = group.length > 0 && group.every((m) => m.played)
  const vis = (m) => filter === 'all' || (filter === 'todo' ? !m.played : m.played)
  const rounds = [...new Set(group.map((m) => m.round))].sort((a, b) => a - b)

  if (!teams.length) return <Empty icon="📅" title="Nessuna squadra">Prima fai il <Link to="/sorteggio" className="text-lime underline">sorteggio</Link>, poi genera il calendario.</Empty>

  async function onGenerate() {
    if (group.length && !confirm('Rigenerare il calendario? I risultati del girone verranno cancellati.')) return
    await generateCalendar(store)
  }
  async function onKnockout() {
    if (!groupDone && !confirm('Il girone non è finito. Generare comunque la fase finale con la classifica attuale?')) return
    if (ko.length && !confirm('La fase finale esiste già: rigenerarla?')) return
    await generateKnockout(store)
  }

  return (
    <div>
      <PageHeader kicker={`${group.filter((m) => m.played).length}/${group.length} partite giocate`} title="Calendario">
        {isAdmin && <>
          <button className="btn-ghost" onClick={onGenerate}>{group.length ? '🔁 Rigenera' : '⚙️ Genera calendario'}</button>
          {group.length > 0 && <button className="btn-ghost" onClick={() => setDates(true)}>📆 Assegna date</button>}
          {group.length > 0 && <button className={groupDone ? 'btn-primary' : 'btn-ghost'} onClick={onKnockout}>🏆 Fase finale</button>}
        </>}
      </PageHeader>

      {!group.length ? (
        <Empty icon="📅" title="Calendario da generare">
          {isAdmin ? <>Girone all'italiana (tutti contro tutti, solo andata): {teams.length * (teams.length - 1) / 2} partite in {teams.length % 2 ? teams.length : teams.length - 1} giornate. Poi semifinali e finale tra le prime 4.<div className="mt-4"><button className="btn-primary" onClick={onGenerate}>⚙️ Genera calendario</button></div></> : 'Il calendario non è ancora pronto.'}
        </Empty>
      ) : (
        <>
          <div className="mb-5 flex gap-2">
            {[['all', 'Tutte'], ['todo', 'Da giocare'], ['done', 'Giocate']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === k ? 'bg-white text-pitch-950' : 'bg-white/10'}`}>{l}</button>
            ))}
          </div>
          {ko.some(vis) && (
            <section className="mb-6">
              <h2 className="mb-2 font-display text-3xl tracking-wide text-gold">🏆 Fase finale</h2>
              <div className="card border-gold/30">{ko.filter(vis).map((m) => <MatchRow key={m.id} match={m} onEdit={setEditing} placeholder={KO_PLACEHOLDER[m.slot]} />)}</div>
            </section>
          )}
          {rounds.map((r) => {
            const list = group.filter((m) => m.round === r && vis(m))
            if (!list.length) return null
            return (
              <section key={r} className="mb-6">
                <h2 className="mb-2 font-display text-2xl tracking-wide text-white/70">Giornata {r}</h2>
                <div className="card">{list.map((m) => <MatchRow key={m.id} match={m} onEdit={setEditing} />)}</div>
              </section>
            )
          })}
        </>
      )}
      {editing && <MatchEditor match={editing} onClose={() => setEditing(null)} />}
      {dates && <DatesModal onClose={() => setDates(false)} />}
    </div>
  )
}

const DAYS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Gio'], [5, 'Ven'], [6, 'Sab'], [0, 'Dom']]
function DatesModal({ onClose }) {
  const { matches, upsert, settings } = useStore()
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const [days, setDays] = useState([2, 4])
  const [times, setTimes] = useState('12:30, 13:00')
  const [onlyEmpty, setOnlyEmpty] = useState(true)
  const [location, setLocation] = useState(settings.location || '')
  const target = matches.filter((m) => m.stage === 'group' && !m.played && (!onlyEmpty || !m.scheduled_at))
    .sort((a, b) => a.round - b.round || new Date(a.created_at) - new Date(b.created_at))
  const tl = times.split(/[,\s]+/).filter((t) => /^\d{1,2}(:\d{2})?$/.test(t))
  const slots = days.length && tl.length ? scheduleSlots({ start, weekdays: days, times: tl, count: target.length }) : []
  const last = slots[slots.length - 1]

  async function apply() {
    await upsert('matches', target.map((m, i) => ({ ...m, scheduled_at: slots[i] || null, location: location || m.location })))
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Assegna le date">
      <p className="mb-4 text-sm text-white/60">Indica quando prenoti il calcetto: le partite vengono messe in ordine di giornata negli slot liberi. Poi puoi correggere ogni singola partita.</p>
      <div className="space-y-4">
        <div><label className="label">Dal giorno</label><input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div>
          <label className="label">Giorni della settimana</label>
          <div className="flex flex-wrap gap-1">
            {DAYS.map(([d, l]) => <button key={d} type="button" onClick={() => setDays((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${days.includes(d) ? 'bg-lime text-pitch-950' : 'bg-white/10'}`}>{l}</button>)}
          </div>
        </div>
        <div><label className="label">Orari (uno per partita, separati da virgola)</label><input className="input" value={times} onChange={(e) => setTimes(e.target.value)} /></div>
        <div><label className="label">Luogo</label><input className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} /> Solo le partite senza data</label>
        <div className="rounded-xl bg-black/25 p-3 text-sm text-white/70">
          {target.length} partite → {tl.length * days.length} slot a settimana
          {last && <> · ultima partita il <b className="text-white">{new Date(last).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</b></>}
        </div>
        <div className="flex justify-end"><button className="btn-primary" disabled={!target.length || !slots.length} onClick={apply}>Assegna</button></div>
      </div>
    </Modal>
  )
}
