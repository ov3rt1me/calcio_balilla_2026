import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Crest from './Crest'

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className={`card max-h-[90vh] w-full overflow-y-auto p-5 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
            initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl tracking-wide">{title}</h2>
              <button className="btn-ghost px-3" onClick={onClose} aria-label="Chiudi">✕</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const h = (e) => {
      const id = Math.random()
      setItems((x) => [...x, { id, msg: e.detail }])
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 6000)
    }
    window.addEventListener('app-error', h)
    return () => window.removeEventListener('app-error', h)
  }, [])
  return (
    <div className="fixed bottom-20 right-4 z-[60] space-y-2 sm:bottom-4">
      {items.map((t) => <div key={t.id} className="card border-magenta/50 px-4 py-3 text-sm">⚠️ {t.msg}</div>)}
    </div>
  )
}

export function TeamName({ team, size = 28, link = true, className = '' }) {
  if (!team) return <span className="text-white/40 italic">Da definire</span>
  const inner = (
    <span className={`flex min-w-0 max-w-full items-center gap-2 ${className}`}>
      <Crest crest={team.crest} size={size} className="shrink-0" />
      <span className="truncate font-semibold">{team.name}</span>
    </span>
  )
  return link ? <Link to={`/squadre#${team.id}`} className="flex min-w-0 max-w-full hover:text-lime">{inner}</Link> : inner
}

export function Empty({ icon = '⚽', title, children }) {
  return (
    <div className="card grid place-items-center gap-3 px-6 py-14 text-center">
      <div className="text-5xl">{icon}</div>
      <div className="font-display text-3xl tracking-wide">{title}</div>
      <div className="max-w-md text-white/60">{children}</div>
    </div>
  )
}

export function PageHeader({ kicker, title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <div className="text-xs font-bold uppercase tracking-[.25em] text-lime">{kicker}</div>}
        <h1 className="h-title">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
