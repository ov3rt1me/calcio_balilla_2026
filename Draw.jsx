import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Link } from 'react-router-dom'
import { useStore } from './store'
import { uid } from './db'
import { LEVELS, planDraw } from './tournament'
import { CLUB_POOL, pickClubs, randomCrest } from './clubs'
import Crest from './Crest'
import Figurina from './Figurina'
import { Empty, PageHeader } from './ui'

export default function Draw() {
  const { players, teams, isAdmin } = useStore()
  const [stage, setStage] = useState(null) // null | {plan, clubs}
  const [redo, setRedo] = useState(false)

  if (stage) return <DrawShow plan={stage.plan} clubs={stage.clubs} onExit={() => { setStage(null); setRedo(false) }} onRestart={() => setStage({ ...stage, plan: planDraw(players) })} />

  if (teams.length && !redo) {
    return (
      <div>
        <PageHeader kicker="Sorteggio" title="Sorteggio completato">
          {isAdmin && <button className="btn-danger" onClick={() => setRedo(true)}>Rifai sorteggio</button>}
        </PageHeader>
        <Board teams={teams} />
      </div>
    )
  }

  if (!isAdmin) return <Empty icon="🎲" title="Sorteggio in arrivo">Le squadre non sono ancora state sorteggiate.</Empty>
  if (players.length < 4) return <Empty icon="🎲" title="Servono almeno 4 giocatori">Aggiungi i giocatori con ruolo e livello nella pagina <Link className="text-lime underline" to="/giocatori">Giocatori</Link>, poi torna qui.</Empty>
  return <DrawSetup redo={redo && teams.length > 0} onCancel={() => setRedo(false)} onStart={(clubs) => setStage({ clubs, plan: planDraw(players) })} />
}

/* ---------------------------------------------------------------- */
function DrawSetup({ onStart, redo, onCancel }) {
  const { players } = useStore()
  const n = Math.floor(players.length / 2)
  const [clubs, setClubs] = useState(() => pickClubs(n))
  useEffect(() => { setClubs((c) => (c.length === n ? c : pickClubs(n))) }, [n])
  const reroll = (i) => setClubs((cs) => cs.map((c, j) => {
    if (j !== i) return c
    const used = new Set(cs.map((x) => x.name))
    const free = CLUB_POOL.filter(([name]) => !used.has(name))
    const [name, short] = free.length ? free[Math.floor(Math.random() * free.length)] : [c.name, c.short]
    return { name, short, crest: randomCrest() }
  }))
  const edit = (i, k, v) => setClubs((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)))

  return (
    <div>
      <PageHeader kicker="Calciomercato" title="Preparazione sorteggio">
        {redo && <button className="btn-ghost" onClick={onCancel}>Annulla</button>}
        <button className="btn-primary text-lg" onClick={() => onStart(clubs)}>🎲 Inizia il sorteggio</button>
      </PageHeader>
      {redo && <div className="card mb-5 border-magenta/40 p-4 text-sm">⚠️ Rifacendo il sorteggio verranno <b>cancellati squadre, calendario e risultati</b> attuali quando confermi il nuovo.</div>}
      <div className="card mb-6 p-5 text-sm leading-relaxed text-white/70">
        <b className="text-white">Come funziona:</b> {players.length} giocatori → <b className="text-lime">{n} squadre</b> da 2 (1 attaccante + 1 difensore).
        Prima si estraggono gli <b>attaccanti</b> dall'urna, fascia per fascia (forti → intermedi → principianti); poi i <b>difensori</b> in ordine inverso
        (principianti → forti). Così chi pesca l'attaccante più forte riceve il difensore meno esperto e le coppie risultano equilibrate. Dentro ogni fascia è tutto casuale.
      </div>
      <h2 className="mb-3 font-display text-3xl tracking-wide">Le {n} squadre partecipanti</h2>
      <p className="mb-4 text-sm text-white/50">Puoi rinominarle o rigenerare nome e stemma con 🔄.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((c, i) => (
          <div key={i} className="card flex items-center gap-3 p-3">
            <Crest crest={c.crest} short={c.short} size={48} />
            <div className="min-w-0 flex-1 space-y-1">
              <input className="input py-1 font-semibold" value={c.name} onChange={(e) => edit(i, 'name', e.target.value)} />
              <input className="input w-24 py-0.5 text-xs uppercase" maxLength={4} value={c.short} onChange={(e) => edit(i, 'short', e.target.value.toUpperCase())} />
            </div>
            <button className="btn-ghost px-3" title="Rigenera" onClick={() => reroll(i)}>🔄</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
const POT = { 1: 'Forti', 2: 'Intermedi', 3: 'Principianti' }
function potTitle(step) {
  if (!step) return ''
  return `Urna ${step.role === 'ATT' ? 'Attaccanti' : 'Difensori'} · Fascia ${POT[step.pot]}`
}

function burst(crest) {
  const colors = crest ? [crest.primary, crest.secondary, crest.accent] : undefined
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors, disableForReducedMotion: true })
}

function DrawShow({ plan, clubs, onExit, onRestart }) {
  const { upsert, removeAll, teams: oldTeams } = useStore()
  const { steps, warnings, reserves } = plan
  const [i, setI] = useState(-1) // -1 = presentazione club
  const [sub, setSub] = useState('ball')
  const [auto, setAuto] = useState(false)
  const [saving, setSaving] = useState(false)
  const done = i >= steps.length
  const step = steps[i]
  const timers = useRef([])

  const next = useCallback(() => { setSub('ball'); setI((x) => Math.min(x + 1, steps.length)) }, [steps.length])

  // sequenza di ogni estrazione: pallina -> figurina -> "ufficiale"
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const T = (fn, ms) => timers.current.push(setTimeout(fn, ms))
    if (i === -1) return
    if (done) {
      T(() => { burst(); T(() => burst(), 350); T(() => burst(), 700) }, 200)
      return
    }
    setSub('ball')
    T(() => setSub('reveal'), 900)
    T(() => { setSub('news'); burst(clubs[step.teamIndex]?.crest) }, 1900)
    return () => timers.current.forEach(clearTimeout)
  }, [i, done, step, clubs])

  // modalità automatica
  useEffect(() => {
    if (!auto || done) return
    if (i === -1) { const t = setTimeout(next, 1500); return () => clearTimeout(t) }
    if (sub === 'news') { const t = setTimeout(next, 2000); return () => clearTimeout(t) }
  }, [auto, done, i, sub, next])

  // assegnazioni visibili sul tabellone
  const assigned = useMemo(() => {
    const upto = done ? steps.length : i < 0 ? 0 : sub === 'news' ? i + 1 : i
    const map = {}
    steps.slice(0, upto).forEach((s) => { (map[s.teamIndex] ||= {})[s.role] = s.player })
    return map
  }, [steps, i, sub, done])

  const boardTeams = clubs.map((c, k) => ({ id: k, ...c, _att: assigned[k]?.ATT, _dif: assigned[k]?.DIF }))
  const flashTeam = !done && sub === 'news' && step ? step.teamIndex : null

  async function confirm() {
    setSaving(true)
    try {
      if (oldTeams.length) { await removeAll('matches'); await removeAll('teams') }
      await upsert('teams', plan.teams.map((t, k) => ({
        id: uid(), name: clubs[k].name, short: clubs[k].short, crest: clubs[k].crest,
        attacker_id: t.attacker.id, defender_id: t.defender.id, seed: k + 1,
      })))
      onExit()
    } finally { setSaving(false) }
  }

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.25em] text-magenta">● Live · Sorteggio ufficiale</div>
          <AnimatePresence mode="wait">
            <motion.h1 key={done ? 'done' : i < 0 ? 'intro' : potTitle(step)} className="h-title" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {done ? 'Squadre fatte!' : i < 0 ? 'Le squadre al via' : potTitle(step)}
            </motion.h1>
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-2">
          {!done && <>
            <button className={`btn-ghost ${auto ? 'border-lime text-lime' : ''}`} onClick={() => setAuto((a) => !a)}>{auto ? '⏸ Pausa' : '⏵ Auto'}</button>
            <button className="btn-ghost" onClick={() => setI(steps.length)}>⏭ Salta</button>
            <button className="btn-primary" onClick={next}>{i < 0 ? 'Via!' : 'Avanti ▶'}</button>
          </>}
          {done && <>
            <button className="btn-ghost" onClick={onExit}>Annulla</button>
            <button className="btn-ghost" onClick={() => { setI(-1); onRestart() }}>🔁 Rifai</button>
            <button className="btn-primary" onClick={confirm} disabled={saving}>{saving ? 'Salvo…' : '✅ Conferma squadre'}</button>
          </>}
        </div>
      </div>

      {/* palco centrale */}
      {!done && i >= 0 && (
        <div className="card relative mb-6 flex min-h-[380px] flex-col items-center justify-center overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(90deg,transparent_0_60px,rgba(255,255,255,.04)_60px_120px)]" />
          <div className="absolute left-4 top-3 text-xs font-semibold text-white/40">Estrazione {i + 1} di {steps.length}</div>
          <AnimatePresence mode="wait">
            {sub === 'ball' ? (
              <motion.div key={'ball' + i} className="h-28 w-28 rounded-full shadow-2xl"
                style={{ background: 'radial-gradient(circle at 35% 30%, #fff, #d9dde8 40%, #8a93a8 75%, #3b4256)' }}
                initial={{ y: -260, scale: 0.6 }} animate={{ y: [-260, 0, -40, 0], scale: 1, rotate: 360 }} exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.85, times: [0, 0.6, 0.8, 1] }} />
            ) : (
              <motion.div key={'card' + i} className="flex flex-col items-center gap-4 md:flex-row md:gap-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -120, scale: 0.4 }}>
                <motion.div initial={{ rotateY: 180, scale: 0.5 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} style={{ perspective: 800 }}>
                  <Figurina player={step.player} role={step.role} size="lg" />
                </motion.div>
                <AnimatePresence>
                  {sub === 'news' && (
                    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} className="max-w-sm text-center md:text-left">
                      <div className="mb-2 inline-block -skew-x-12 bg-magenta px-3 py-1 font-display text-xl tracking-widest text-white">Ufficiale</div>
                      <div className="font-display text-5xl leading-none">{step.player.name}</div>
                      <div className="my-2 text-white/60">firma con</div>
                      <div className="flex items-center justify-center gap-3 md:justify-start">
                        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.1 }}>
                          <Crest crest={clubs[step.teamIndex].crest} short={clubs[step.teamIndex].short} size={64} />
                        </motion.div>
                        <div className="font-display text-4xl leading-none text-lime">{clubs[step.teamIndex].name}</div>
                      </div>
                      <div className="mt-2 text-sm text-white/50">Ruolo: {step.role === 'ATT' ? 'attaccante' : 'difensore'}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          {/* ticker */}
          <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-black/40 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/50">
            <motion.div className="whitespace-nowrap" animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}>
              {Array(2).fill(clubs.map((c) => `${c.short} · ${c.name}`).join('   ⚽   ')).join('   ⚽   ')}
            </motion.div>
          </div>
        </div>
      )}

      {(done || i < 0) && (warnings.length > 0) && (
        <div className="card mb-5 border-gold/40 p-4 text-sm text-gold">{warnings.map((w) => <div key={w}>ℹ️ {w}</div>)}</div>
      )}

      <Board teams={boardTeams} live flash={flashTeam} />
      {done && reserves.length > 0 && <div className="mt-4 text-center text-white/60">Riserva: <b className="text-white">{reserves.map((r) => r.name).join(', ')}</b></div>}
    </div>
  )
}

/* ---------------------------------------------------------------- */
function Slot({ player, role }) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-lg bg-black/25 px-2">
      <span className={`w-9 rounded px-1 text-center font-display text-sm ${role === 'ATT' ? 'bg-magenta/80' : 'bg-sky-600/80'}`}>{role}</span>
      <AnimatePresence mode="wait">
        {player ? (
          <motion.div key={player.id} className="flex min-w-0 items-center gap-2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            {player.photo_url ? <img src={player.photo_url} className="h-8 w-8 rounded-full object-cover object-top" alt="" /> : <div className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-xs font-bold">{player.name[0]}</div>}
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{player.name}</div>
              <div className="text-[10px] text-gold">{'★'.repeat(LEVELS[player.level].stars)}</div>
            </div>
          </motion.div>
        ) : <motion.div key="empty" className="text-sm text-white/25">in attesa…</motion.div>}
      </AnimatePresence>
    </div>
  )
}

export function Board({ teams, live, flash }) {
  const { playersById } = useStore()
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {teams.map((t, k) => {
        const att = live ? t._att : playersById[t.attacker_id]
        const dif = live ? t._dif : playersById[t.defender_id]
        return (
          <motion.div key={t.id} layout
            initial={live ? { opacity: 0, scale: 0.6, y: 30 } : false} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: live ? k * 0.12 : 0 }}
            className={`card overflow-hidden p-3 transition-shadow ${flash === k ? 'shadow-[0_0_0_3px_var(--color-lime),0_0_40px_rgba(198,255,61,.35)]' : ''}`}
            style={{ backgroundImage: `linear-gradient(135deg, ${t.crest?.primary}33, transparent 60%)` }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Crest crest={t.crest} short={t.short} size={40} />
              <div className="font-display text-2xl leading-none tracking-wide">{t.name}</div>
            </div>
            <div className="space-y-2"><Slot player={att} role="ATT" /><Slot player={dif} role="DIF" /></div>
          </motion.div>
        )
      })}
    </div>
  )
}
