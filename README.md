# ⚽ Torneo di Calcio Balilla

Sito per organizzare un torneo di calcio balilla 2 contro 2: figurine dei giocatori, sorteggio "calciomercato" a fasce,
calendario con le prenotazioni, risultati, classifica, marcatori, fase finale e scheda partita esportabile come immagine.

**Tecnologie:** React + Vite, Tailwind CSS, Framer Motion (animazioni), canvas-confetti, html-to-image,
Supabase (database, login e foto), GitHub Pages (hosting gratuito).

---

## 1. Provarlo subito sul tuo PC

Serve [Node.js](https://nodejs.org) 20 o più recente.

```bash
npm install
npm run dev
```

Apri l'indirizzo che compare (di solito http://localhost:5173). Senza Supabase il sito parte in **modalità locale**:
i dati restano nel browser. In *Impostazioni* (badge "Modalità locale" in alto) c'è il pulsante **"Carica 12 giocatori di prova"**.

## 2. Creare il database su Supabase (gratis, 5 minuti)

1. Registrati su [supabase.com](https://supabase.com) → **New project** (regione: Central EU / Frankfurt).
2. **SQL Editor → New query**: incolla tutto il file `supabase/schema.sql` e premi **Run**.
   Il file crea le tabelle, le regole di sicurezza, il realtime e il bucket `figurine` per le foto.
3. **Authentication → Sign In / Providers**: disattiva *Allow new users to sign up*.
4. **Authentication → Users → Add user → Create new user**: crea il tuo utente organizzatore con email e password.
5. **Project Settings → API**: copia *Project URL* e la chiave *anon public*.

Per provarlo in locale con Supabase copia `.env.example` in `.env.local` e incolla i due valori.

> Chiunque apra il sito vede il torneo senza login. Solo chi entra con l'utente creato al punto 4 può modificare.
> La chiave *anon* è fatta per essere pubblica: la sicurezza dipende dalle regole (RLS) del file SQL.

## 3. Pubblicarlo su GitHub Pages

1. Crea un repository su GitHub (es. `torneo-balilla`) e carica questi file:
   ```bash
   git init && git add . && git commit -m "Torneo balilla"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/torneo-balilla.git
   git push -u origin main
   ```
2. Nel repository: **Settings → Secrets and variables → Actions → Variables → New repository variable**
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = chiave anon public
3. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Vai su **Actions** e rilancia il workflow *Pubblica su GitHub Pages* (o fai un nuovo push).
   Il sito sarà su `https://TUO-UTENTE.github.io/torneo-balilla/`.

Ogni `git push` sul ramo `main` ripubblica il sito da solo.

## Come si usa

| Passo | Pagina | Cosa fare |
|---|---|---|
| 1 | **Giocatori** | Aggiungi nome, soprannome, ruolo (attacco/difesa), livello (★★★ forte, ★★ intermedio, ★ principiante) e foto. "Aggiunta rapida" accetta una lista `Nome, ATT, F` una per riga. |
| 2 | **Sorteggio** | Scegli/rigenera i club e i loro stemmi, poi avvia lo show. **Avanti** per ogni estrazione, **Auto** per farlo andare da solo (perfetto da proiettare), **Salta** per vedere subito il risultato. Poi **Conferma squadre**. |
| 3 | **Calendario** | *Genera calendario* (girone all'italiana, solo andata), poi *Assegna date* indicando da quando, in quali giorni e a che ore prenoti il calcetto. Ogni partita si può correggere a mano. |
| 4 | **Risultati** | *Risultato* su ogni partita: punteggio, gol dei singoli giocatori (facoltativi, servono per i marcatori e le statistiche sulle figurine), note. |
| 5 | **Classifica** | Si aggiorna da sola. A fine girone: *Fase finale* → semifinali 1ª-4ª e 2ª-3ª, poi la finale si compila con le vincenti. |
| — | **Scheda partita** | Clic sul punteggio → scheda con stemmi, figurine e gol. *Scarica immagine* per mandarla nel gruppo WhatsApp. |

### Regole del sorteggio a fasce
- Ogni squadra = 1 attaccante + 1 difensore.
- Si estraggono prima gli attaccanti dall'urna, fascia per fascia (forti → intermedi → principianti), assegnandoli alle squadre in ordine.
- Poi i difensori in ordine inverso (principianti → forti): chi ha l'attaccante più forte riceve il difensore meno esperto, così le coppie sono equilibrate. Dentro ogni fascia l'ordine è casuale.
- Con un numero dispari di giocatori uno fa la riserva. Se attaccanti e difensori non sono in numero uguale, qualcuno viene spostato di ruolo (il sito lo segnala).

### Classifica
Vittoria 3 punti, pareggio 1 (nel girone è consentito, in fase finale no). A pari punti contano differenza reti, scontro diretto e gol fatti.

## Personalizzare
- **Nomi e stemmi dei club**: `src/lib/clubs.js` (nomi inventati, nessun marchio reale).
- **Colori e font**: `src/index.css` (sezione `@theme`).
- **Regole di sorteggio / classifica**: `src/lib/tournament.js`.

## Backup
In *Impostazioni* trovi **Esporta** e **Importa** (file JSON). Serve anche per portare su Supabase i dati inseriti in modalità locale.
