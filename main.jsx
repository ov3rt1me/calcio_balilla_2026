import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './lib/store'
import Layout from './components/Layout'
import Home from './pages/Home'
import Players from './pages/Players'
import Draw from './pages/Draw'
import Teams from './pages/Teams'
import Calendar from './pages/Calendar'
import Standings from './pages/Standings'
import MatchSheet from './pages/MatchSheet'
import Admin from './pages/Admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="giocatori" element={<Players />} />
            <Route path="sorteggio" element={<Draw />} />
            <Route path="squadre" element={<Teams />} />
            <Route path="calendario" element={<Calendar />} />
            <Route path="classifica" element={<Standings />} />
            <Route path="partita/:id" element={<MatchSheet />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  </StrictMode>
)
