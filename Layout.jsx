import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from './store'
import { Toasts } from './ui'

const NAV = [
  ['/', 'Home', '🏠'], ['/giocatori', 'Giocatori', '🃏'], ['/sorteggio', 'Sorteggio', '🎲'],
  ['/squadre', 'Squadre', '🛡️'], ['/calendario', 'Calendario', '📅'], ['/classifica', 'Classifica', '🏆'],
]

export default function Layout() {
  const { settings, mode, user, signOut, error } = useStore()
  const cls = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-lime text-pitch-950' : 'text-white/70 hover:bg-white/10 hover:text-white'}`
  return (
    <div className="min-h-screen pb-24 sm:pb-10">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-pitch-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lime text-xl text-pitch-950">⚽</span>
            <span className="truncate font-display text-2xl tracking-wide">{settings.name || 'Torneo Balilla'}</span>
          </NavLink>
          <nav className="ml-auto hidden gap-1 lg:flex">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={cls}>{label}</NavLink>)}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-2">
            {mode === 'local' ? (
              <NavLink to="/admin" className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold">Modalità locale</NavLink>
            ) : user ? (
              <>
                <NavLink to="/admin" className="rounded-full border border-lime/40 px-3 py-1 text-xs font-semibold text-lime">Admin</NavLink>
                <button className="text-xs text-white/50 hover:text-white" onClick={signOut}>Esci</button>
              </>
            ) : (
              <NavLink to="/admin" className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70">Accedi</NavLink>
            )}
          </div>
        </div>
      </header>

      {error && <div className="mx-auto mt-4 max-w-6xl px-4"><div className="card border-magenta/50 p-3 text-sm">Errore di connessione al database: {error}</div></div>}

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/10 bg-pitch-950/95 px-1 py-1.5 backdrop-blur lg:hidden">
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center rounded-lg px-2 py-1 text-[10px] font-semibold ${isActive ? 'text-lime' : 'text-white/60'}`}>
            <span className="text-lg leading-none">{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <Toasts />
    </div>
  )
}
