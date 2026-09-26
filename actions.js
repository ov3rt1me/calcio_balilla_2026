import { uid } from './db'
import { roundRobin, standings, winnerId } from './tournament'

export async function generateCalendar(store) {
  const { teams, settings, upsert, remove, matches } = store
  const old = matches.filter((m) => m.stage === 'group').map((m) => m.id)
  if (old.length) await remove('matches', old)
  await upsert('matches', roundRobin(teams.map((t) => t.id)).map((m) => ({
    id: uid(), stage: 'group', ...m, location: settings.location || null, played: false, scorers: {},
  })))
}

/** Crea semifinali (1ª-4ª, 2ª-3ª) e finale; con meno di 4 squadre solo la finale tra le prime 2. */
export async function generateKnockout(store) {
  const { teams, matches, settings, upsert, remove } = store
  const ko = matches.filter((m) => m.stage !== 'group').map((m) => m.id)
  if (ko.length) await remove('matches', ko)
  const tab = standings(teams, matches)
  const base = { location: settings.location || null, played: false, scorers: {} }
  const rows = []
  if (teams.length >= 4 && Number(settings.finalists || 4) >= 4) {
    rows.push({ id: uid(), stage: 'sf', slot: 'sf1', round: 100, home_id: tab[0].team.id, away_id: tab[3].team.id, ...base })
    rows.push({ id: uid(), stage: 'sf', slot: 'sf2', round: 100, home_id: tab[1].team.id, away_id: tab[2].team.id, ...base })
    rows.push({ id: uid(), stage: 'final', slot: 'final', round: 101, home_id: null, away_id: null, ...base })
  } else {
    rows.push({ id: uid(), stage: 'final', slot: 'final', round: 101, home_id: tab[0].team.id, away_id: tab[1]?.team.id ?? null, ...base })
  }
  await upsert('matches', rows)
}

/** Salva un risultato; se è una semifinale aggiorna le squadre della finale. */
export async function saveMatch(store, match) {
  await store.upsert('matches', match)
  if (match.stage !== 'sf') return
  const all = store.matches.map((m) => (m.id === match.id ? { ...m, ...match } : m))
  const sf1 = all.find((m) => m.slot === 'sf1'), sf2 = all.find((m) => m.slot === 'sf2')
  const fin = all.find((m) => m.slot === 'final')
  if (!fin) return
  const h = winnerId(sf1), a = winnerId(sf2)
  if (fin.home_id !== h || fin.away_id !== a) {
    await store.upsert('matches', { id: fin.id, home_id: h, away_id: a, ...(fin.played && (fin.home_id !== h || fin.away_id !== a) ? { played: false, home_score: null, away_score: null } : {}) })
  }
}
