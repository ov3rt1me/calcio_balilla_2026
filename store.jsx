import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { db, MODE } from './db'

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState({ players: [], teams: [], matches: [], settings: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const refresh = useCallback(async () => {
    try { setData(await db.load()); setError(null) }
    catch (e) { setError(e.message || String(e)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    db.getUser().then(setUser).catch(() => {})
    const un1 = db.subscribe(() => refresh())
    const un2 = db.onAuth(setUser)
    return () => { un1(); un2() }
  }, [refresh])

  // wrapper che ricarica i dati dopo ogni scrittura
  const act = useCallback((fn) => async (...args) => {
    try { const r = await fn(...args); await refresh(); return r }
    catch (e) { alertError(e); throw e }
  }, [refresh])

  const value = useMemo(() => {
    const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]))
    return {
      ...data, loading, error, user, mode: MODE,
      isAdmin: MODE === 'local' || !!user,
      playersById: byId(data.players),
      teamsById: byId(data.teams),
      refresh,
      upsert: act((t, r) => db.upsert(t, r)),
      remove: act((t, ids) => db.remove(t, ids)),
      removeAll: act((t) => db.removeAll(t)),
      saveSettings: act((s) => db.saveSettings(s)),
      upload: (f) => db.upload(f),
      signIn: (e, p) => db.signIn(e, p),
      signOut: () => db.signOut(),
    }
  }, [data, loading, error, user, refresh, act])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function alertError(e) {
  console.error(e)
  window.dispatchEvent(new CustomEvent('app-error', { detail: e.message || String(e) }))
}

export const useStore = () => useContext(Ctx)
