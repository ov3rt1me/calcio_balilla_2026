// Club inventati "stile campionato inglese" — nomi e stemmi originali, nessun marchio reale.
export const CLUB_POOL = [
  ['Real Frullino', 'RFR'], ['Atletico Stecca', 'ATS'], ['Sporting Manopola', 'SPM'],
  ['Dinamo Rullata', 'DIN'], ['Olympique Molla', 'OLM'], ['Inter Rimbalzo', 'INR'],
  ['Borussia Pallina', 'BOP'], ['Racing Traversa', 'RAC'], ['Union Gancio', 'UNG'],
  ['Athletic Veronica', 'ATV'], ['Deportivo Sponda', 'DEP'], ['Rapid Tirolino', 'RAP'],
  ['Wanderers del Biliardino', 'WAN'], ['Rovers Mezzapunta', 'ROV'], ['United Portierino', 'UNP'],
  ['Albion Manubrio', 'ALB'], ['Hotspur Pinzata', 'HOT'], ['City Gommino', 'CIG'],
  ['Villa Rulletto', 'VIL'], ['Forest Gettone', 'FOR'], ['Palace Carambola', 'PAL'],
  ['Rangers Stoccata', 'RAN'], ['Celtic Schiaffo', 'CEL'], ['Academica Pinball', 'ACA'],
]

const PALETTES = [
  ['#c8102e', '#ffffff', '#f5c542'], ['#0b3d91', '#ffffff', '#c6ff3d'], ['#6c1d45', '#99d6ea', '#ffffff'],
  ['#034694', '#f5c542', '#ffffff'], ['#132257', '#ffffff', '#ff2d87'], ['#fdb913', '#231f20', '#ffffff'],
  ['#1b458f', '#c4122e', '#ffffff'], ['#00a650', '#ffffff', '#111111'], ['#6cabdd', '#1c2c5b', '#ffffff'],
  ['#e03a3e', '#111111', '#ffffff'], ['#7a263a', '#f3d459', '#ffffff'], ['#ff6a13', '#1d1d1b', '#ffffff'],
  ['#241f20', '#ffffff', '#c6ff3d'], ['#5d2e8c', '#f5c542', '#ffffff'], ['#0e7c7b', '#fcee21', '#111111'],
  ['#e4007c', '#111827', '#ffffff'],
]
const SHAPES = ['shield', 'round', 'hex', 'classic']
const PATTERNS = ['stripes', 'half', 'hoops', 'sash', 'plain', 'chevron', 'quarters']
const ICONS = ['ball', 'star', 'bolt', 'crown', 'rod']

export function randomCrest(rand = Math.random) {
  const pick = (a) => a[Math.floor(rand() * a.length)]
  const [primary, secondary, accent] = pick(PALETTES)
  return { shape: pick(SHAPES), pattern: pick(PATTERNS), icon: pick(ICONS), primary, secondary, accent }
}

/** Sceglie `n` club casuali dal pool con stemmi generati. */
export function pickClubs(n) {
  const pool = [...CLUB_POOL].sort(() => Math.random() - 0.5)
  const palettes = [...PALETTES].sort(() => Math.random() - 0.5)
  return Array.from({ length: n }, (_, i) => {
    const [name, short] = pool[i % pool.length]
    const crest = randomCrest()
    const [primary, secondary, accent] = palettes[i % palettes.length]
    return { name: i >= pool.length ? `${name} ${Math.floor(i / pool.length) + 1}` : name, short, crest: { ...crest, primary, secondary, accent } }
  })
}
