import { useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { uid } from '../lib/db'
import { PageHeader } from '../components/ui'

const DEMO = [
  ['Marco', 'ATT', 1], ['Giulia', 'ATT', 1], ['Luca', 'ATT', 2], ['Sara', 'ATT', 2], ['Paolo', 'ATT', 3], ['Elena', 'ATT', 3],
  ['Andrea', 'DIF', 1], ['Chiara', 'DIF', 1], ['Davide', 'DIF', 2], ['Marta', 'DIF', 2], ['Stefano', 'DIF', 3], ['Anna', 'DIF', 3],
]

export default function Admin() {
  const store = useStore()
  const { mode, user, isAdmin, settings, saveSettings, players, teams, matches, upsert, removeAll } = store
  if (mode === 'supabase' && !user) return <Login />
  if (!isAdmin) return null
  return (
    <div className="space-y-6">
      <PageHeader kicker={mode === 'local' ? 'Modalità locale' : `Admin · ${user?.email}`} title="Impostazioni" />
      {mode === 'local' && (
        <div className="card border-gold/40 p-4 text-sm text-white/70">
          <b className="text-gold">Modalità locale:</b> i dati sono salvati solo in questo browser. Per condividere classifica e risultati con tutti, collega Supabase (istruzioni nel README) e ripubblica il sito.
          Nel frattempo puoi usare <b>Esporta</b> per fare un backup e poi importarlo su Supabase.
        </div>
      )}
      <SettingsForm settings={settings} onSave={saveSettings} />
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-2xl tracking-wide">Dati</h2>
        <div className="text-sm text-white/60">{players.length} giocatori · {teams.length} squadre · {matches.length} partite</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => exportData(store)}>⬇️ Esporta backup (JSON)</button>
          <ImportButton />
          {!players.length && <button className="btn-ghost" onClick={() => upsert('players', DEMO.map(([name, role, level]) => ({ id: uid(), name, role, level })))}>🧪 Carica 12 giocatori di prova</button>}
        </div>
      </section>
      <section className="card space-y-3 border-magenta/30 p-5">
        <h2 className="font-display text-2xl tracking-wide text-magenta">Zona pericolosa</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-danger" onClick={async () => { if (confirm('Cancellare calendario e risultati?')) await removeAll('matches') }}>Cancella calendario</button>
          <button className="btn-danger" onClick={async () => { if (confirm('Cancellare squadre, calendario e risultati? I giocatori restano.')) { await removeAll('matches'); await removeAll('teams') } }}>Nuovo torneo (tieni i giocatori)</button>
          <button className="btn-danger" onClick={async () => { if (confirm('Cancellare TUTTO, giocatori compresi?')) { await removeAll('matches'); await removeAll('teams'); await removeAll('players') } }}>Cancella tutto</button>
        </div>
      </section>
    </div>
  )
}

function SettingsForm({ settings, onSave }) {
  const [f, setF] = useState({ name: settings.name || '', location: settings.location || '', finalists: settings.finalists || 4 })
  const [ok, setOk] = useState(false)
  return (
    <form className="card grid gap-4 p-5 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); await onSave({ ...f, finalists: Number(f.finalists) }); setOk(true); setTimeout(() => setOk(false), 2000) }}>
      <div className="sm:col-span-2"><label className="label">Nome del torneo</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><label className="label">Luogo predefinito</label><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="es. Sala relax, 2° piano" /></div>
      <div><label className="label">Fase finale</label>
        <select className="input" value={f.finalists} onChange={(e) => setF({ ...f, finalists: e.target.value })}>
          <option value={4}>Semifinali + finale (prime 4)</option><option value={2}>Solo finale (prime 2)</option>
        </select>
      </div>
      <div className="sm:col-span-2"><button className="btn-primary">{ok ? '✓ Salvato' : 'Salva impostazioni'}</button></div>
    </form>
  )
}

function exportData({ players, teams, matches, settings }) {
  const blob = new Blob([JSON.stringify({ players, teams, matches, settings }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `torneo-balilla-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
}

function ImportButton() {
  const { upsert, removeAll, saveSettings } = useStore()
  const ref = useRef()
  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const d = JSON.parse(await file.text())
    if (!confirm(`Importare ${d.players?.length || 0} giocatori, ${d.teams?.length || 0} squadre e ${d.matches?.length || 0} partite? I dati attuali verranno sostituiti.`)) return
    await removeAll('matches'); await removeAll('teams'); await removeAll('players')
    if (d.players?.length) await upsert('players', d.players)
    if (d.teams?.length) await upsert('teams', d.teams)
    if (d.matches?.length) await upsert('matches', d.matches)
    if (d.settings) { const { id, ...s } = d.settings; await saveSettings(s) }
    e.target.value = ''
  }
  return <><input ref={ref} type="file" accept="application/json" className="hidden" onChange={onFile} /><button className="btn-ghost" onClick={() => ref.current.click()}>⬆️ Importa backup</button></>
}

function Login() {
  const { signIn } = useStore()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  return (
    <form className="card mx-auto mt-10 max-w-sm space-y-4 p-6" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await signIn(email, pwd) } catch (x) { setErr(x.message) } }}>
      <h1 className="font-display text-4xl tracking-wide">Accesso organizzatore</h1>
      <p className="text-sm text-white/60">Solo l'organizzatore può inserire giocatori e risultati. Tutti gli altri vedono il torneo senza login.</p>
      <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><label className="label">Password</label><input className="input" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required /></div>
      {err && <div className="text-sm text-magenta">{err}</div>}
      <button className="btn-primary w-full">Entra</button>
    </form>
  )
}
