export const LEVELS = {
  1: { label: 'Forte', short: 'F', stars: 3, card: 'gold' },
  2: { label: 'Intermedio', short: 'I', stars: 2, card: 'silver' },
  3: { label: 'Principiante', short: 'P', stars: 1, card: 'bronze' },
}
export const ROLES = { ATT: 'Attacco', DIF: 'Difesa' }

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const byLevelShuffled = (list, order) => order.flatMap((lvl) => shuffle(list.filter((p) => p.level === lvl)))

/**
 * Sorteggio a fasce stile Champions.
 * - Ogni squadra = 1 attaccante + 1 difensore.
 * - Attaccanti estratti per fascia dal più forte (Fascia 1) al principiante,
 *   difensori estratti dal principiante al più forte: chi ha l'attaccante migliore
 *   riceve il difensore meno esperto => squadre equilibrate, ordine casuale dentro ogni fascia.
 * Restituisce le squadre (senza nome club) e la sequenza di "estrazioni" per l'animazione.
 */
export function planDraw(players) {
  const warnings = []
  let att = shuffle(players.filter((p) => p.role === 'ATT'))
  let dif = shuffle(players.filter((p) => p.role === 'DIF'))
  const reserves = []

  if ((att.length + dif.length) % 2 === 1) {
    // riserva: scelta a caso tra i principianti (o livello più basso) del ruolo più numeroso
    const big = att.length >= dif.length ? att : dif
    const minLvl = Math.max(...big.map((p) => p.level))
    const cand = shuffle(big.filter((p) => p.level === minLvl))[0]
    reserves.push(cand)
    if (big === att) att = att.filter((p) => p !== cand); else dif = dif.filter((p) => p !== cand)
    warnings.push(`${cand.name} è la riserva (giocatori dispari).`)
  }
  const moved = []
  while (att.length > dif.length) { const p = att.pop(); dif.push({ ...p, role: 'DIF' }); moved.push(p) }
  while (dif.length > att.length) { const p = dif.pop(); att.push({ ...p, role: 'ATT' }); moved.push(p) }
  moved.forEach((p) => warnings.push(`${p.name} giocherà in ${p.role === 'ATT' ? 'difesa' : 'attacco'} per completare le coppie.`))

  const n = att.length
  const attOrder = byLevelShuffled(att, [1, 2, 3])
  const difOrder = byLevelShuffled(dif, [3, 2, 1])
  const teams = Array.from({ length: n }, (_, i) => ({ seed: i + 1, attacker: attOrder[i], defender: difOrder[i] }))
  const steps = [
    ...attOrder.map((p, i) => ({ role: 'ATT', player: p, teamIndex: i, pot: p.level })),
    ...difOrder.map((p, i) => ({ role: 'DIF', player: p, teamIndex: i, pot: p.level })),
  ]
  return { teams, steps, warnings, reserves }
}

/** Girone all'italiana (metodo del cerchio), solo andata. */
export function roundRobin(teamIds) {
  const ids = [...shuffle(teamIds)]
  if (ids.length % 2) ids.push(null)
  const n = ids.length
  const rounds = []
  const homes = {}
  let arr = [...ids]
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i]
      if (!a || !b) continue
      // chi ha giocato meno partite "in casa" (colonna sinistra) va a sinistra
      const [h, w] = (homes[a] || 0) <= (homes[b] || 0) ? [a, b] : [b, a]
      homes[h] = (homes[h] || 0) + 1
      rounds.push({ round: r + 1, home_id: h, away_id: w })
    }
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)]
  }
  return rounds
}

/** Genera gli slot di prenotazione: dal giorno di partenza, nei giorni della settimana scelti, agli orari indicati. */
export function scheduleSlots({ start, weekdays, times, count }) {
  const slots = []
  const d = new Date(start + 'T00:00:00')
  let guard = 0
  while (slots.length < count && guard++ < 1000) {
    if (weekdays.includes(d.getDay())) {
      for (const t of times) {
        if (slots.length >= count) break
        const [h, m] = t.split(':').map(Number)
        const s = new Date(d); s.setHours(h, m || 0, 0, 0)
        slots.push(s.toISOString())
      }
    }
    d.setDate(d.getDate() + 1)
  }
  return slots
}

export function winnerId(m) {
  if (!m?.played || m.home_score == null || m.away_score == null) return null
  if (m.home_score === m.away_score) return null
  return m.home_score > m.away_score ? m.home_id : m.away_id
}

export function standings(teams, matches) {
  const rows = Object.fromEntries(teams.map((t) => [t.id, { team: t, g: 0, v: 0, n: 0, p: 0, gf: 0, gs: 0, pt: 0, form: [] }]))
  const played = matches.filter((m) => m.stage === 'group' && m.played).sort((a, b) => new Date(a.scheduled_at || a.created_at) - new Date(b.scheduled_at || b.created_at))
  for (const m of played) {
    const h = rows[m.home_id], a = rows[m.away_id]
    if (!h || !a) continue
    h.g++; a.g++
    h.gf += m.home_score; h.gs += m.away_score; a.gf += m.away_score; a.gs += m.home_score
    if (m.home_score > m.away_score) { h.v++; a.p++; h.pt += 3; h.form.push('V'); a.form.push('P') }
    else if (m.home_score < m.away_score) { a.v++; h.p++; a.pt += 3; a.form.push('V'); h.form.push('P') }
    else { h.n++; a.n++; h.pt++; a.pt++; h.form.push('N'); a.form.push('N') }
  }
  const list = Object.values(rows)
  // scontro diretto come terzo criterio tra due squadre a pari punti
  const h2h = (x, y) => {
    const m = played.find((m) => (m.home_id === x.team.id && m.away_id === y.team.id) || (m.home_id === y.team.id && m.away_id === x.team.id))
    const w = winnerId(m)
    return w === x.team.id ? -1 : w === y.team.id ? 1 : 0
  }
  list.sort((x, y) => y.pt - x.pt || (y.gf - y.gs) - (x.gf - x.gs) || h2h(x, y) || y.gf - x.gf || x.team.name.localeCompare(y.team.name))
  return list.map((r, i) => ({ ...r, pos: i + 1, dr: r.gf - r.gs, form: r.form.slice(-5) }))
}

export function playerStats(players, teams, matches) {
  const teamOf = {}
  teams.forEach((t) => { teamOf[t.attacker_id] = t; teamOf[t.defender_id] = t })
  const stats = Object.fromEntries(players.map((p) => [p.id, { pg: 0, v: 0, gol: 0 }]))
  for (const m of matches.filter((m) => m.played)) {
    for (const [pid, g] of Object.entries(m.scorers || {})) if (stats[pid]) stats[pid].gol += Number(g) || 0
    const w = winnerId(m)
    for (const p of players) {
      const t = teamOf[p.id]
      if (!t || (t.id !== m.home_id && t.id !== m.away_id)) continue
      stats[p.id].pg++
      if (w === t.id) stats[p.id].v++
    }
  }
  return { stats, teamOf }
}

export const STAGE_LABEL = { group: 'Girone', sf: 'Semifinale', final: 'Finale' }

export function fmtDate(iso, opts = {}) {
  if (!iso) return 'Da prenotare'
  return new Date(iso).toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', ...opts })
}
