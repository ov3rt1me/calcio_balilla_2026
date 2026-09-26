import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../lib/store'
import { uid } from '../lib/db'
import { LEVELS, ROLES, playerStats } from '../lib/tournament'
import Figurina from '../components/Figurina'
import { Empty, Modal, PageHeader } from '../components/ui'

const blank = { name: '', nickname: '', role: 'ATT', level: 2, photo_url: '' }

export default function Players() {
  const { players, teams, matches, isAdmin, upsert, remove } = useStore()
  const [edit, setEdit] = useState(null)
  const [bulk, setBulk] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const { stats, teamOf } = useMemo(() => playerStats(players, teams, matches), [players, teams, matches])

  const shown = players
    .filter((p) => filter === 'ALL' || p.role === filter)
    .sort((a, b) => a.role.localeCompare(b.role) || a.level - b.level || a.name.localeCompare(b.name))
  const count = (role, lvl) => players.filter((p) => p.role === role && (!lvl || p.level === lvl)).length

  return (
    <div>
      <PageHeader kicker="La rosa" title="Giocatori & figurine">
        {isAdmin && <>
          <button className="btn-ghost" onClick={() => setBulk(true)}>Aggiunta rapida</button>
          <button className="btn-primary" onClick={() => setEdit(blank)}>+ Giocatore</button>
        </>}
      </PageHeader>

      {players.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {['ATT', 'DIF'].map((r) => (
            <div key={r} className="card p-4">
              <div className="label">{ROLES[r]}</div>
              <div className="font-display text-4xl">{count(r)}</div>
              <div className="mt-1 flex gap-3 text-xs text-white/60">
                {[1, 2, 3].map((l) => <span key={l}>{LEVELS[l].label}: <b className="text-white">{count(r, l)}</b></span>)}
              </div>
            </div>
          ))}
          <div className="card p-4">
            <div className="label">Squadre possibili</div>
            <div className="font-display text-4xl">{Math.floor(players.length / 2)}</div>
            <div className="mt-1 text-xs text-white/60">
              {players.length % 2 ? '1 giocatore farà la riserva. ' : ''}
              {count('ATT') !== count('DIF') ? 'Ruoli sbilanciati: qualcuno cambierà ruolo.' : 'Ruoli bilanciati ✓'}
            </div>
          </div>
        </div>
      )}

      {players.length > 0 && (
        <div className="mb-5 flex gap-2">
          {[['ALL', 'Tutti'], ['ATT', 'Attaccanti'], ['DIF', 'Difensori']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === k ? 'bg-white text-pitch-950' : 'bg-white/10'}`}>{l}</button>
          ))}
        </div>
      )}

      {players.length === 0 ? (
        <Empty icon="🃏" title="Nessun giocatore">
          {isAdmin ? 'Aggiungi i giocatori uno alla volta con la foto, oppure incolla la lista con “Aggiunta rapida”.' : 'La rosa non è ancora stata inserita.'}
        </Empty>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] justify-items-center gap-5">
          {shown.map((p, i) => (
            <motion.button
              key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.5) }}
              whileHover={{ y: -6, rotate: -1 }} onClick={() => isAdmin && setEdit(p)} className={isAdmin ? '' : 'cursor-default'}
            >
              <Figurina player={p} team={teamOf[p.id]} stats={stats[p.id]} />
            </motion.button>
          ))}
        </div>
      )}

      {edit && <PlayerForm player={edit} onClose={() => setEdit(null)} onSave={upsert} onDelete={remove} />}
      <BulkAdd open={bulk} onClose={() => setBulk(false)} onSave={upsert} />
    </div>
  )
}

function Toggle({ value, options, onChange }) {
  return (
    <div className="flex rounded-xl bg-pitch-950/70 p-1">
      {options.map(([v, l]) => (
        <button type="button" key={v} onClick={() => onChange(v)} className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${value === v ? 'bg-lime text-pitch-950' : 'text-white/60'}`}>{l}</button>
      ))}
    </div>
  )
}

function PlayerForm({ player, onClose, onSave, onDelete }) {
  const { upload } = useStore()
  const [f, setF] = useState(player || blank)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef()
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try { set('photo_url')(await upload(file)) } finally { setBusy(false) }
  }
  async function save(e) {
    e.preventDefault()
    if (!f.name.trim()) return
    setBusy(true)
    try {
      await onSave('players', { id: f.id || uid(), name: f.name.trim(), nickname: f.nickname?.trim() || null, role: f.role, level: Number(f.level), photo_url: f.photo_url || null })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={!!player} onClose={onClose} title={f.id ? 'Modifica giocatore' : 'Nuovo giocatore'}>
      <form onSubmit={save} className="grid gap-5 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <Figurina player={{ ...f, name: f.name || 'Nome' }} size="sm" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <button type="button" className="btn-ghost text-sm" onClick={() => fileRef.current.click()} disabled={busy}>📷 {f.photo_url ? 'Cambia foto' : 'Carica foto'}</button>
          {f.photo_url && <button type="button" className="text-xs text-white/50 hover:text-magenta" onClick={() => set('photo_url')('')}>Rimuovi foto</button>}
        </div>
        <div className="space-y-4">
          <div><label className="label">Nome</label><input className="input" value={f.name} onChange={set('name')} autoFocus required /></div>
          <div><label className="label">Soprannome (facoltativo)</label><input className="input" value={f.nickname || ''} onChange={set('nickname')} placeholder="es. Il Muro" /></div>
          <div><label className="label">Ruolo</label><Toggle value={f.role} onChange={set('role')} options={[['ATT', 'Attacco'], ['DIF', 'Difesa']]} /></div>
          <div><label className="label">Livello</label><Toggle value={Number(f.level)} onChange={set('level')} options={[[1, '★★★ Forte'], [2, '★★ Medio'], [3, '★ Princ.']]} /></div>
          <div className="flex justify-between gap-2 pt-2">
            {f.id ? <button type="button" className="btn-danger" onClick={async () => { if (confirm(`Eliminare ${f.name}?`)) { await onDelete('players', f.id); onClose() } }}>Elimina</button> : <span />}
            <button className="btn-primary" disabled={busy}>{busy ? 'Salvo…' : 'Salva'}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function parseLevel(s = '') {
  s = s.trim().toLowerCase()
  if (['1', 'f', 'forte', '3*', '***'].includes(s)) return 1
  if (['3', 'p', 'principiante', 'princ', 'b', '*'].includes(s)) return 3
  return 2
}
function BulkAdd({ open, onClose, onSave }) {
  const [text, setText] = useState('')
  const rows = text.split('\n').map((l) => l.split(/[,;\t]/).map((x) => x.trim())).filter((r) => r[0])
    .map(([name, role = 'ATT', level]) => ({ id: uid(), name, role: /^d/i.test(role) ? 'DIF' : 'ATT', level: parseLevel(level) }))
  return (
    <Modal open={open} onClose={onClose} title="Aggiunta rapida">
      <p className="mb-3 text-sm text-white/60">Un giocatore per riga: <code className="text-lime">Nome, Ruolo, Livello</code>. Ruolo: ATT o DIF. Livello: F (forte), I (intermedio), P (principiante). Le foto le aggiungi dopo cliccando sulla figurina.</p>
      <textarea className="input h-48 font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder={'Mario Rossi, ATT, F\nLuca Bianchi, DIF, P\nGiulia Verdi, DIF, I'} />
      {rows.length > 0 && <div className="mt-2 text-sm text-white/60">{rows.length} giocatori: {rows.map((r) => `${r.name} (${r.role} ${LEVELS[r.level].short})`).join(', ')}</div>}
      <div className="mt-4 flex justify-end"><button className="btn-primary" disabled={!rows.length} onClick={async () => { await onSave('players', rows); setText(''); onClose() }}>Aggiungi {rows.length || ''}</button></div>
    </Modal>
  )
}
