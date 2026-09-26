import { useState } from 'react'
import { useStore } from './store'
import { saveMatch } from './actions'
import { STAGE_LABEL } from './tournament'
import Crest from './Crest'
import { Modal } from './ui'

const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function Stepper({ value, onChange, big }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" className="btn-ghost h-9 w-9 p-0" onClick={() => onChange(Math.max(0, (value || 0) - 1))}>−</button>
      <input type="number" min="0" className={`input text-center ${big ? 'w-20 font-display text-4xl' : 'w-14'}`} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))} />
      <button type="button" className="btn-ghost h-9 w-9 p-0" onClick={() => onChange((value || 0) + 1)}>+</button>
    </div>
  )
}

export default function MatchEditor({ match, onClose }) {
  const store = useStore()
  const { teamsById, playersById } = store
  const [m, setM] = useState({ scorers: {}, ...match })
  const [busy, setBusy] = useState(false)
  const home = teamsById[m.home_id], away = teamsById[m.away_id]
  const set = (k, v) => setM((x) => ({ ...x, [k]: v }))
  const setGoal = (pid, v) => setM((x) => ({ ...x, scorers: { ...x.scorers, [pid]: v } }))
  const ko = m.stage !== 'group'
  const sum = (t) => t ? (Number(m.scorers?.[t.attacker_id]) || 0) + (Number(m.scorers?.[t.defender_id]) || 0) : 0
  const hasPlayerGoals = Object.values(m.scorers || {}).some((g) => Number(g) > 0)
  const mismatch = hasPlayerGoals && (sum(home) !== (m.home_score || 0) || sum(away) !== (m.away_score || 0))
  const scoresSet = m.home_score != null && m.away_score != null
  const drawInKo = ko && scoresSet && m.home_score === m.away_score

  async function save(played) {
    setBusy(true)
    try {
      const scorers = Object.fromEntries(Object.entries(m.scorers || {}).filter(([, g]) => Number(g) > 0))
      await saveMatch(store, {
        id: m.id, stage: m.stage, home_id: m.home_id, away_id: m.away_id,
        scheduled_at: m.scheduled_at || null, location: m.location || null, notes: m.notes || null,
        home_score: played ? m.home_score : null, away_score: played ? m.away_score : null, played, scorers: played ? scorers : {},
      })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={`${STAGE_LABEL[m.stage]}${m.stage === 'group' ? ` · Giornata ${m.round}` : ''}`} wide>
      <div className="grid gap-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {[home, away].map((t, k) => (
            <div key={k} className={`flex flex-col items-center gap-2 text-center ${k ? 'order-3' : ''}`}>
              <Crest crest={t?.crest} short={t?.short} size={56} />
              <div className="font-display text-2xl leading-none">{t?.name || 'Da definire'}</div>
              <Stepper big value={k ? m.away_score : m.home_score} onChange={(v) => set(k ? 'away_score' : 'home_score', v)} />
            </div>
          ))}
          <div className="order-2 font-display text-3xl text-white/30">–</div>
        </div>

        {home && away && (
          <div>
            <div className="label">Gol per giocatore (facoltativo)</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[home, away].map((t) => (
                <div key={t.id} className="space-y-2 rounded-xl bg-black/20 p-3">
                  {[['ATT', t.attacker_id], ['DIF', t.defender_id]].map(([r, pid]) => (
                    <div key={pid} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm"><b className="text-white/40">{r}</b> {playersById[pid]?.name || '—'}</span>
                      <Stepper value={m.scorers?.[pid] ?? 0} onChange={(v) => setGoal(pid, v)} />
                    </div>
                  ))}
                  <div className="text-right text-xs text-white/40">Totale {sum(t)}</div>
                </div>
              ))}
            </div>
            {mismatch && <div className="mt-2 flex items-center justify-between gap-2 text-sm text-gold">I gol dei giocatori non corrispondono al risultato.
              <button type="button" className="btn-ghost py-1 text-xs" onClick={() => setM((x) => ({ ...x, home_score: sum(home), away_score: sum(away) }))}>Usa la somma</button></div>}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Data e ora prenotazione</label><input type="datetime-local" className="input" value={toLocalInput(m.scheduled_at)} onChange={(e) => set('scheduled_at', e.target.value ? new Date(e.target.value).toISOString() : null)} /></div>
          <div><label className="label">Luogo / tavolo</label><input className="input" value={m.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
        </div>
        <div><label className="label">Note / cronaca</label><textarea className="input h-20" value={m.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="es. Rimonta pazzesca da 3-8…" /></div>

        {drawInKo && <div className="text-sm text-magenta">Nella fase finale non è previsto il pareggio.</div>}
        <div className="flex flex-wrap justify-between gap-2">
          <button className="btn-ghost" disabled={busy} onClick={() => save(false)}>{match.played ? 'Annulla risultato' : 'Salva solo data'}</button>
          <button className="btn-primary" disabled={busy || !scoresSet || drawInKo || !home || !away} onClick={() => save(true)}>✅ Salva risultato</button>
        </div>
      </div>
    </Modal>
  )
}
