// La scène Far West en SVG : des bonshommes bâtons sur fond transparent,
// qui arrivent l'un après l'autre et se promènent. Animée en CSS seulement.
// Le seul texte : des onomatopées dans des bulles, jamais de phrases.

type Pas = readonly [pourcent: number, x: number]

type Promeneur = {
  id: string
  sorte: 'cheval' | 'penseur' | 'virevoltant'
  y: number
  taille: number
  duree: number
  delai: number
  // Le trajet : en quel pourcentage du cycle il est à quel x.
  trajet: readonly Pas[]
  // Où il reste planté quand l'animation est coupée (mouvement réduit).
  repos: number
  versLaGauche?: boolean
  // Les onomatopées de sa bulle, l'une après l'autre.
  mots?: readonly string[]
}

// ---------- Les bulles d'onomatopées ----------

// Une bulle centrée en (x, y) (le bout de sa pointe), dont les mots défilent
// l'un après l'autre ; elle disparaît un moment entre deux tournées.
// `miroir` remet le texte à l'endroit quand le bonhomme est retourné.
function bulle(id: string, x: number, y: number, mots: readonly string[], periode: number, delai: number, miroir: boolean): string {
  const l = Math.max(...mots.map(m => m.length)) * 7.6 + 16
  const h = 20
  const n = mots.length
  // La bulle est visible 80 % du temps, chaque mot occupe une part égale.
  const part = 80 / n
  const styles = mots
    .map((_, i) => {
      const a = (i * part).toFixed(2)
      const b = ((i + 1) * part).toFixed(2)
      return `@keyframes b${id}${i}{0%{opacity:0}${a}%{opacity:0}${(+a + 0.01).toFixed(2)}%{opacity:1}${b}%{opacity:1}${(+b + 0.01).toFixed(2)}%{opacity:0}100%{opacity:0}}.b${id}${i}{opacity:0;animation:b${id}${i} ${periode}s steps(1,end) ${delai}s infinite}`
    })
    .join('')
  const fond = `@keyframes b${id}{0%{opacity:1;transform:scale(0.6)}4%{transform:scale(1)}80%{opacity:1;transform:scale(1)}80.01%{opacity:0}100%{opacity:0}}.b${id}{transform-box:fill-box;transform-origin:50% 100%;opacity:0;animation:b${id} ${periode}s ease-out ${delai}s infinite}`
  return `<style>${fond}${styles}</style>
<g transform="translate(${x} ${y})${miroir ? ' scale(-1 1)' : ''}"><g class="b${id}">
  <path class="bulle" d="M${-l / 2 + 8} ${-h - 8} H${l / 2 - 8} Q${l / 2} ${-h - 8} ${l / 2} ${-h} Q${l / 2} -8 ${l / 2 - 8} -8 H4 L0 0 L-4 -8 H${-l / 2 + 8} Q${-l / 2} -8 ${-l / 2} ${-h} Q${-l / 2} ${-h - 8} ${-l / 2 + 8} ${-h - 8} Z"/>
  ${mots.map((m, i) => `<text class="mot b${id}${i}" x="0" y="-12.5" text-anchor="middle">${m}</text>`).join('')}
</g></g>`
}

// Un mot lâché sans bulle (le cheval qui hennit, le vent), qui clignote.
function cri(x: number, y: number, mot: string, classe: string, miroir: boolean): string {
  return `<g transform="translate(${x} ${y})${miroir ? ' scale(-1 1)' : ''}"><text class="${classe}" x="0" y="0" text-anchor="middle">${mot}</text></g>`
}

// ---------- Les mouvements ----------

// Jambes qui bougent seulement quand le bonhomme avance.
function jambes(id: string, trajet: readonly Pas[], amplitude: number): string {
  const etapes: string[] = []
  for (let i = 0; i < trajet.length - 1; i++) {
    const [p0, x0] = trajet[i] ?? [0, 0]
    const [p1, x1] = trajet[i + 1] ?? [100, 0]
    if (x0 === x1) {
      etapes.push(`${p0}%{transform:rotate(0deg)}`, `${p1}%{transform:rotate(0deg)}`)
      continue
    }
    let signe = 1
    for (let p = p0; p < p1; p += 1.5) {
      etapes.push(`${p.toFixed(2)}%{transform:rotate(${signe * amplitude}deg)}`)
      signe = -signe
    }
    etapes.push(`${p1}%{transform:rotate(0deg)}`)
  }
  const inverse = etapes.map(e => e.replace(/rotate\((-?)([\d.]+)deg\)/, (_, s: string, n: string) => `rotate(${s === '-' ? '' : '-'}${n}deg)`))
  return `@keyframes ja${id}{${etapes.join('')}}@keyframes jb${id}{${inverse.join('')}}`
}

function deplacement(p: Promeneur): string {
  const etapes = p.trajet.map(([pc, x]) => `${pc}%{transform:translate(${x - p.repos}px,0px)}`)
  return `@keyframes m${p.id}{${etapes.join('')}}`
}

function css(p: Promeneur): string {
  const anim = `${p.duree}s linear ${p.delai}s infinite backwards`
  let s = deplacement(p) + `.m${p.id}{animation:m${p.id} ${anim}}`
  if (p.sorte === 'penseur') {
    s += jambes(p.id, p.trajet, 24)
    s += `.m${p.id} .ja{animation:ja${p.id} ${anim}}.m${p.id} .jb{animation:jb${p.id} ${anim}}`
  }
  return s
}

// ---------- Les personnages ----------

const cheval = (p: Promeneur) => {
  const g = !!p.versLaGauche
  return `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${g ? -p.taille : p.taille} ${p.taille})">
  <g class="trot">
    <path class="s" d="M-20 -26 H20 L30 -41 L40 -37 M-20 -26 L-29 -19"/>
    <line class="s galopA" x1="16" y1="-26" x2="16" y2="0"/>
    <line class="s galopB" x1="20" y1="-26" x2="20" y2="0"/>
    <line class="s galopB" x1="-17" y1="-26" x2="-17" y2="0"/>
    <line class="s galopA" x1="-13" y1="-26" x2="-13" y2="0"/>
    <circle class="s" cx="0" cy="-52" r="5"/>
    <path class="s" d="M-8 -57 H8 M-4 -57 V-62 H4 V-57"/>
    <path class="s" d="M0 -47 V-28 L-7 -19 M0 -40 L-8 -34 M0 -42 L8 -56"/>
    <g class="lasso">
      <line class="s fin" x1="8" y1="-56" x2="8" y2="-67"/>
      <ellipse class="s fin" cx="8" cy="-73" rx="10" ry="6"/>
    </g>
  </g>
  ${cri(52, -46, 'Hiiiii !', 'hennit', g)}
  ${cri(-44, -4, 'tagada tagada', 'tagada', g)}
  ${bulle(p.id, -14, -66, p.mots ?? ['Yiii-haaa !', 'Hue !'], 5, p.delai + 0.5, g)}
</g></g>`
}

const penseur = (p: Promeneur) => `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${p.versLaGauche ? -p.taille : p.taille} ${p.taille})">
  <circle class="s" cx="0" cy="-52" r="6"/>
  <path class="s" d="M0 -46 V-22 M0 -40 L-9 -27 M0 -40 L10 -48"/>
  <line class="s ja" x1="0" y1="-22" x2="-7" y2="0"/>
  <line class="s jb" x1="0" y1="-22" x2="7" y2="0"/>
  <line class="s gratte" x1="10" y1="-48" x2="6" y2="-59"/>
  ${bulle(p.id, -4, -62, p.mots ?? ['Hmmm…', 'Euh…', 'Pfff…'], 6, p.delai + 1, !!p.versLaGauche)}
</g></g>`

// Le virevoltant : une boule de broussailles qui roule et rebondit, poussée par le vent.
const virevoltant = (p: Promeneur) => `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${p.versLaGauche ? -p.taille : p.taille} ${p.taille})">
  <g class="rebond"><g transform="translate(0 -14)"><g class="roule">
    <path class="s fin" d="M-12 0 C-12 -9 -4 -13 3 -12 C11 -10 14 -2 11 5 C8 12 -2 14 -8 9 C-14 4 -9 -6 -2 -6 C5 -6 7 2 2 5 C-3 8 -7 2 -3 -1 M-10 -6 L9 8 M-6 10 L8 -9 M-13 3 L12 -3"/>
  </g></g></g>
  ${cri(-30, -28, 'Fffiouuu…', 'vent', !!p.versLaGauche)}
</g></g>`

// Le shérif : il entre, se plante, et fouette le texte de la conversation.
const sherif = (x: number, y: number, taille: number, delai: number) => `
<g class="sherifEntre"><g transform="translate(${x} ${y}) scale(${taille})">
  <circle class="s" cx="0" cy="-52" r="6"/>
  <path class="s" d="M-12 -57 H12 M-6 -57 V-65 H6 V-57"/>
  <path class="s" d="M0 -46 V-22 M0 -40 L-9 -28"/>
  <polygon class="etoile" points="-4,-43 -2.6,-39.6 1,-39.6 -1.8,-37.4 -0.8,-34 -4,-36 -7.2,-34 -6.2,-37.4 -9,-39.6 -5.4,-39.6"/>
  <line class="s ja sherifPas" x1="0" y1="-22" x2="-8" y2="0"/>
  <line class="s jb sherifPas" x1="0" y1="-22" x2="8" y2="0"/>
  <g transform="translate(0 -40)"><g class="bras">
    <line class="s" x1="0" y1="0" x2="12" y2="-6"/>
    <path class="s fin fouet" d="M12 -6 C40 -40 70 -20 95 0"/>
  </g></g>
  <g class="impact">
    <path class="choc" d="M98 -50 L106 -60 M102 -40 L114 -42 M98 -30 L106 -20 M92 -54 L92 -64 M94 -26 L90 -16"/>
    <text class="clac" x="108" y="-64">CLAC !</text>
  </g>
  ${bulle('sh', -14, -68, ['Grrr !', 'Ha !', 'Hop !'], 4.8, delai + 3, false)}
</g></g>
<style>
  .sherifEntre{animation:sherifEntre 3s ease-out ${delai}s 1 backwards}
  @keyframes sherifEntre{0%{transform:translate(-260px,0px)}100%{transform:translate(0px,0px)}}
  .sherifPas.ja{animation:pas 0.4s linear ${delai}s 7 alternate}
  .sherifPas.jb{animation:pas 0.4s linear ${delai + 0.2}s 7 alternate-reverse}
  @keyframes pas{0%{transform:rotate(-22deg)}100%{transform:rotate(22deg)}}
  .bras{transform-origin:0px 0px;animation:coup 1.6s ease-in ${delai + 3}s infinite backwards}
  @keyframes coup{0%{transform:rotate(-75deg)}35%{transform:rotate(-85deg)}45%{transform:rotate(8deg)}52%{transform:rotate(0deg)}75%{transform:rotate(2deg)}100%{transform:rotate(-75deg)}}
  .impact{opacity:0;animation:clac 1.6s linear ${delai + 3}s infinite}
  @keyframes clac{0%{opacity:0}44%{opacity:0}46%{opacity:1}72%{opacity:1}76%{opacity:0}100%{opacity:0}}
</style>`

const dessin = (p: Promeneur) => (p.sorte === 'cheval' ? cheval(p) : p.sorte === 'penseur' ? penseur(p) : virevoltant(p))

function scene(largeur: number, hauteur: number, promeneurs: readonly Promeneur[], sherifEn?: { x: number; y: number; taille: number; delai: number }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="xMidYMid slice">
<style>
  .s{fill:none;stroke:#5b3a1e;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .fin{stroke-width:1.6}
  .etoile{fill:#d4a017;stroke:#8a6508;stroke-width:0.6}
  .choc{fill:none;stroke:#d9480f;stroke-width:2.6;stroke-linecap:round}
  .clac{fill:#d9480f;font:bold 13px sans-serif}
  .bulle{fill:#fff8e7;stroke:#5b3a1e;stroke-width:1.6;stroke-linejoin:round}
  .mot{fill:#b0360c;font:bold 12px sans-serif}
  .hennit{fill:#8a5a2b;font:italic bold 10px sans-serif;animation:clignote 2.6s steps(1,end) infinite}
  .tagada{fill:#a8865e;font:italic 8px sans-serif;opacity:0.8}
  .vent{fill:#a8865e;font:italic 9px sans-serif;animation:clignote 3s steps(1,end) infinite}
  @keyframes clignote{0%{opacity:0}55%{opacity:1}90%{opacity:0}}
  .ja,.jb,.galopA,.galopB,.gratte{transform-box:fill-box}
  .galopA,.galopB{transform-origin:50% 0%}.ja{transform-origin:100% 0%}.jb{transform-origin:0% 0%}
  .galopA{animation:galop 0.5s linear infinite alternate}
  .galopB{animation:galop 0.5s linear infinite alternate-reverse}
  @keyframes galop{0%{transform:rotate(-24deg)}100%{transform:rotate(24deg)}}
  .trot{animation:trot 0.25s ease-in-out infinite alternate}
  @keyframes trot{0%{transform:translate(0px,0px)}100%{transform:translate(0px,-3px)}}
  .lasso{transform-box:fill-box;transform-origin:50% 100%;animation:tourne 0.9s linear infinite}
  .gratte{transform-origin:100% 100%;animation:gratte 0.3s ease-in-out infinite alternate}
  @keyframes gratte{0%{transform:rotate(-14deg)}100%{transform:rotate(12deg)}}
  .roule{transform-box:fill-box;transform-origin:50% 50%;animation:tourne 1.1s linear infinite}
  .rebond{animation:rebond 0.55s ease-out infinite alternate}
  @keyframes rebond{0%{transform:translate(0px,0px)}100%{transform:translate(0px,-12px)}}
  @keyframes tourne{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @media (prefers-color-scheme: dark){.s{stroke:#f0d9b5}.choc{stroke:#ff8a4c}.clac{fill:#ff8a4c}.bulle{fill:#3a2a1a;stroke:#f0d9b5}.mot{fill:#ffb27a}.hennit,.tagada,.vent{fill:#d9bf98}}
  ${promeneurs.map(css).join('\n  ')}
</style>
${promeneurs.map(dessin).join('')}
${sherifEn ? sherif(sherifEn.x, sherifEn.y, sherifEn.taille, sherifEn.delai) : ''}
</svg>`
}

// Derrière toute la conversation (app de bureau, mobile) : 1000 × 600.
// Chacun arrive à son tour : 0 s, 1,5 s (le shérif), 4 s, 7 s, 10 s, 12 s.
export const SCENE_ECRAN = scene(
  1000,
  600,
  [
    { id: 'c1', sorte: 'cheval', y: 130, taille: 1.1, duree: 14, delai: 0, repos: 880, trajet: [[0, -150], [100, 1150]], mots: ['Yiii-haaa !', 'Hue !'] },
    { id: 'p1', sorte: 'penseur', y: 310, taille: 1.1, duree: 18, delai: 4, repos: 900, versLaGauche: true, trajet: [[0, 1080], [18, 900], [55, 900], [70, 940], [85, 940], [100, 1080]], mots: ['Hmmm…', 'Euh…', 'Gniii…'] },
    { id: 'c2', sorte: 'cheval', y: 430, taille: 1.1, duree: 16, delai: 7, repos: 80, versLaGauche: true, trajet: [[0, 1150], [100, -150]], mots: ['Yahou !', 'Ho-hé !'] },
    { id: 'p2', sorte: 'penseur', y: 480, taille: 1.1, duree: 20, delai: 10, repos: 110, trajet: [[0, -80], [15, 110], [50, 110], [62, 70], [80, 70], [100, -80]], mots: ['Pfff…', 'Hum ?', 'Mmmh…'] },
    { id: 'v1', sorte: 'virevoltant', y: 575, taille: 1.3, duree: 11, delai: 12, repos: 500, trajet: [[0, -60], [100, 1060]] },
  ],
  { x: 190, y: 260, taille: 1.4, delai: 1.5 },
)

// Dans un bandeau (VS Code, qui n'a pas de fond de scène) : 1000 × 140.
export const SCENE_BANDEAU = scene(
  1000,
  140,
  [
    { id: 'rc1', sorte: 'cheval', y: 130, taille: 1, duree: 12, delai: 0, repos: 700, trajet: [[0, -150], [100, 1150]], mots: ['Yiii-haaa !', 'Hue !'] },
    { id: 'rp1', sorte: 'penseur', y: 130, taille: 1, duree: 16, delai: 3, repos: 880, versLaGauche: true, trajet: [[0, 1080], [20, 880], [60, 880], [100, 1080]], mots: ['Hmmm…', 'Euh…'] },
    { id: 'rc2', sorte: 'cheval', y: 130, taille: 1, duree: 14, delai: 6, repos: 450, versLaGauche: true, trajet: [[0, 1150], [100, -150]], mots: ['Yahou !', 'Ho-hé !'] },
    { id: 'rv1', sorte: 'virevoltant', y: 132, taille: 0.9, duree: 10, delai: 9, repos: 300, trajet: [[0, -60], [100, 1060]] },
  ],
  { x: 60, y: 130, taille: 1, delai: 1.5 },
)

// Un fond vide et transparent, quand personne ne se promène.
export const SCENE_VIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>'
