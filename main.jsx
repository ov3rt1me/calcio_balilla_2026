import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './store'
import Layout from './Layout'
import Home from './Home'
import Players from './Players'
import Draw from './Draw'
import Teams from './Teams'
import Calendar from './Calendar'
import Standings from './Standings'
import MatchSheet from './MatchSheet'
import Admin from './Admin'

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
