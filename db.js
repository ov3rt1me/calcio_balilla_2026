// Layer dati: Supabase se configurato, altrimenti localStorage (modalità locale / demo).
import { createClient } from '@supabase/supabase-js'

const SB_URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = SB_URL && KEY ? createClient(SB_URL, KEY) : null
export const MODE = supabase ? 'supabase' : 'local'

export const TABLES = ['players', 'teams', 'matches']
export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))

const DEFAULT_SETTINGS = { id: 1, name: 'Torneo di Calcio Balilla', location: 'Calcetto', finalists: 4 }

/** Ridimensiona un'immagine a max `size` px e la restituisce come Blob JPEG. */
export async function resizeImage(file, size = 600) {
  const img = await new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = URL.createObjectURL(file)
  })
  const scale = Math.min(1, size / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale)
  c.height = Math.round(img.height * scale)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85))
}
const blobToDataUrl = (blob) =>
  new Promise((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.readAsDataURL(blob)
  })

/* ------------------------------------------------------------------ */
/* Backend locale                                                      */
/* ------------------------------------------------------------------ */
const LS_KEY = 'torneo-balilla-db'
const listeners = new Set()
function readLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (raw) return { players: [], teams: [], matches: [], ...raw, settings: { ...DEFAULT_SETTINGS, ...raw.settings } }
  } catch { /* storage non disponibile */ }
  return { players: [], teams: [], matches: [], settings: { ...DEFAULT_SETTINGS } }
}
let memory = null
function writeLocal(data) {
  memory = data
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* pieno o bloccato: resta in memoria */ }
  listeners.forEach((l) => l())
}
const local = {
  async load() { if (!memory) memory = readLocal(); return structuredClone(memory) },
  async upsert(table, rows) {
    const d = await this.load()
    for (const row of [].concat(rows)) {
      const i = d[table].findIndex((r) => r.id === row.id)
      if (i >= 0) d[table][i] = { ...d[table][i], ...row }
      else d[table].push({ created_at: new Date().toISOString(), ...row })
    }
    writeLocal(d)
  },
  async remove(table, ids) {
    const d = await this.load()
    const set = new Set([].concat(ids))
    d[table] = d[table].filter((r) => !set.has(r.id))
    writeLocal(d)
  },
  async removeAll(table) { const d = await this.load(); d[table] = []; writeLocal(d) },
  async saveSettings(s) { const d = await this.load(); d.settings = { ...d.settings, ...s }; writeLocal(d) },
  async upload(file) { return blobToDataUrl(await resizeImage(file)) },
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) },
  // in locale sei sempre admin
  async getUser() { return { email: 'locale' } },
  onAuth() { return () => {} },
  async signIn() {}, async signOut() {},
  exportJson() { return JSON.stringify(memory || readLocal(), null, 2) },
  importJson(text) { const d = JSON.parse(text); writeLocal({ ...readLocal(), ...d }) },
}

/* ------------------------------------------------------------------ */
/* Backend Supabase                                                    */
/* ------------------------------------------------------------------ */
const check = ({ data, error }) => { if (error) throw error; return data }
const remote = {
  async load() {
    const [players, teams, matches, settings] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('teams').select('*').order('seed'),
      supabase.from('matches').select('*').order('round').order('created_at'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ])
    return {
      players: check(players), teams: check(teams), matches: check(matches),
      settings: { ...DEFAULT_SETTINGS, ...(check(settings) || {}) },
    }
  },
  async upsert(table, rows) { check(await supabase.from(table).upsert([].concat(rows))) },
  async remove(table, ids) { check(await supabase.from(table).delete().in('id', [].concat(ids))) },
  async removeAll(table) { check(await supabase.from(table).delete().not('id', 'is', null)) },
  async saveSettings(s) { check(await supabase.from('settings').upsert({ id: 1, ...s })) },
  async upload(file) {
    const blob = await resizeImage(file)
    const path = `${uid()}.jpg`
    check(await supabase.storage.from('figurine').upload(path, blob, { contentType: 'image/jpeg' }))
    return supabase.storage.from('figurine').getPublicUrl(path).data.publicUrl
  },
  subscribe(cb) {
    const ch = supabase.channel('db-changes')
    for (const t of [...TABLES, 'settings']) ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, cb)
    ch.subscribe()
    return () => supabase.removeChannel(ch)
  },
  async getUser() { return (await supabase.auth.getUser()).data.user },
  onAuth(cb) { const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); return () => data.subscription.unsubscribe() },
  async signIn(email, password) { check(await supabase.auth.signInWithPassword({ email, password })) },
  async signOut() { await supabase.auth.signOut() },
}

export const db = supabase ? remote : local
export { local as localDb }
