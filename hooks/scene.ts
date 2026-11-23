// La scène Far West en SVG : des cow-boys dessinés comme par un enfant
// (visage, chapeau, chemise de couleur, bottes ; des chevaux avec un corps,
// une crinière, une queue et des sabots), sur fond transparent. Ils arrivent
// l'un après l'autre et se promènent. Animée en CSS seulement.
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
  // La couleur de la chemise, et pour un cheval celle de sa robe.
  habit?: string
  robe?: string
}

type Sherif = { x: number; y: number; taille: number; delai: number; portee: number }

// ---------- Les bulles d'onomatopées ----------

// Une bulle centrée en (x, y) (le bout de sa pointe), dont les mots défilent
// l'un après l'autre ; elle disparaît un moment entre deux tournées.
// `miroir` remet le texte à l'endroit quand le personnage est retourné.
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
    s += jambes(p.id, p.trajet, 20)
    s += `.m${p.id} .ja{animation:ja${p.id} ${anim}}.m${p.id} .jb{animation:jb${p.id} ${anim}}`
  }
  return s
}

// ---------- Les morceaux des personnages ----------

// Une tête ronde avec deux yeux et une bouche, centrée en (cx, cy).
const tete = (cx: number, cy: number, bouche: 'sourire' | 'hesite' | 'moustache') => `
  <circle class="c peau" cx="${cx}" cy="${cy}" r="7"/>
  <circle class="oeil" cx="${cx - 2.5}" cy="${cy - 1}" r="1"/><circle class="oeil" cx="${cx + 2.5}" cy="${cy - 1}" r="1"/>
  ${
    bouche === 'sourire'
      ? `<path class="s fin" d="M${cx - 2.6} ${cy + 2.6} Q${cx} ${cy + 4.6} ${cx + 2.6} ${cy + 2.6}"/>`
      : bouche === 'hesite'
        ? `<path class="s fin" d="M${cx - 2.6} ${cy + 3.4} q1.3 -1.2 2.6 0 t2.6 0"/>`
        : `<path class="moustache" d="M${cx - 4} ${cy + 3} q2 -2 4 -0.6 q2 -1.4 4 0.6"/>`
  }`

// Un chapeau de cow-boy posé sur une tête centrée en (cx, cy).
const chapeau = (cx: number, cy: number, classe = 'chapeau') => {
  const b = cy - 6
  return `
  <path class="c ${classe}" d="M${cx - 12} ${b} Q${cx} ${b - 3.5} ${cx + 12} ${b} Q${cx} ${b + 2.5} ${cx - 12} ${b} Z"/>
  <path class="c ${classe}" d="M${cx - 6.5} ${b - 0.5} Q${cx - 7} ${b - 10} ${cx - 3} ${b - 9} Q${cx} ${b - 7} ${cx + 3} ${b - 9} Q${cx + 7} ${b - 10} ${cx + 6.5} ${b - 0.5} Z"/>`
}

// Une jambe en jean avec sa botte, de la hanche (x, -25) au sol.
const jambe = (classe: string, x: number, pied: number) => `
  <g class="${classe}">
    <line class="jean" x1="${x}" y1="-25" x2="${x + pied * 0.4}" y2="-3.5"/>
    <path class="c botte" d="M${x + pied * 0.4 - 3} -5 L${x + pied * 0.4 + 2} -5 L${x + pied * 0.4 + 2 + pied * 1.6} -1.2 L${x + pied * 0.4 + 2 + pied * 1.6} 0.5 L${x + pied * 0.4 - 3} 0.5 Z"/>
  </g>`

// Une patte de cheval qui galope, avec son sabot.
const patte = (classe: string, x: number, robe: string) => `
  <g class="${classe}">
    <line class="patteFond" x1="${x}" y1="-25" x2="${x}" y2="-3"/>
    <line class="patte" style="stroke:${robe}" x1="${x}" y1="-25" x2="${x}" y2="-3"/>
    <rect class="sabot" x="${x - 3}" y="-4" width="6" height="4" rx="1"/>
  </g>`

// ---------- Les personnages ----------

const cheval = (p: Promeneur) => {
  const g = !!p.versLaGauche
  const robe = p.robe ?? '#b5733a'
  const habit = p.habit ?? '#c8553d'
  return `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${g ? -p.taille : p.taille} ${p.taille})">
  <g class="trot">
    <path class="crin" d="M-23 -34 C-33 -36 -38 -27 -35 -14 M-23 -31 C-30 -29 -32 -21 -29 -13"/>
    ${patte('galopB', -17, robe)}${patte('galopA', -11, robe)}
    <path class="c" style="fill:${robe}" d="M13 -38 L22 -57 L31 -53 L23 -27 Z"/>
    <ellipse class="c" style="fill:${robe}" cx="0" cy="-31" rx="25" ry="11"/>
    ${patte('galopA', 13, robe)}${patte('galopB', 19, robe)}
    <path class="c" style="fill:${robe}" d="M24 -58 L25 -67 L30 -60 Z"/>
    <ellipse class="c" style="fill:${robe}" cx="33" cy="-53" rx="11" ry="6.5" transform="rotate(28 33 -53)"/>
    <circle class="oeil" cx="31" cy="-56" r="1.3"/><circle class="oeil" cx="40" cy="-48.5" r="0.9"/>
    <path class="crin" d="M25 -62 Q19 -59 21 -55 Q15 -52 18 -48 Q12 -45 15 -41"/>
    <path class="c selle" d="M-12 -41 Q-2 -46 9 -41 L8 -37 L-11 -37 Z"/>
    <path class="jeanR" d="M-1 -43 L5 -37 L4 -29"/>
    <path class="c botte" d="M1 -30 L7 -30 L9 -26.5 L1 -26.5 Z"/>
    <path class="c" style="fill:${habit}" d="M-6 -59 L4 -59 L5 -42 L-6 -42 Z"/>
    <path class="s" d="M3 -55 L13 -50"/><line class="rene" x1="13" y1="-50" x2="31" y2="-51"/>
    <path class="s" d="M2 -57 L12 -71"/>
    ${tete(-0.5, -66, 'sourire')}
    <path class="c foulard" d="M-4.5 -59.5 L3.5 -59.5 L-0.5 -55 Z"/>
    ${chapeau(-0.5, -66)}
    <g class="lasso">
      <line class="s fin" x1="12" y1="-71" x2="12" y2="-81"/>
      <ellipse class="s fin" cx="12" cy="-87" rx="11" ry="5"/>
    </g>
  </g>
  ${cri(56, -60, 'Hiiiii !', 'hennit', g)}
  ${cri(-52, -3, 'tagada tagada', 'tagada', g)}
  ${bulle(p.id, -48, -80, p.mots ?? ['Yiii-haaa !', 'Hue !'], 5, p.delai + 0.5, g)}
</g></g>`
}

const penseur = (p: Promeneur) => `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${p.versLaGauche ? -p.taille : p.taille} ${p.taille})">
  ${jambe('ja', -3, -1)}${jambe('jb', 3, 1)}
  <path class="c" style="fill:${p.habit ?? '#4a7fb5'}" d="M-5.5 -47 L5.5 -47 L7 -24 L-7 -24 Z"/>
  <line class="ceinture" x1="-6.8" y1="-27" x2="6.8" y2="-27"/>
  <path class="s" d="M-5 -44 L-10 -31"/><circle class="c peau" cx="-10" cy="-30" r="2"/>
  <path class="s" d="M5 -44 L12 -50"/>
  ${tete(0, -55, 'hesite')}
  ${chapeau(0, -55)}
  <line class="s gratte" x1="12" y1="-50" x2="8" y2="-61"/>
  ${bulle(p.id, -6, -74, p.mots ?? ['Hmmm…', 'Euh…', 'Pfff…'], 6, p.delai + 1, !!p.versLaGauche)}
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
// `portee` : jusqu'où va le bout du fouet, depuis son épaule.
const sherif = ({ x, y, taille, delai, portee }: Sherif) => {
  // Le bout du fouet arrive en (5 + portee, -44) ; le choc est dessiné autour de (100, -40).
  const dx = 5 + portee - 98
  const dy = -4
  const r = portee - 12
  return `
<g class="sherifEntre"><g transform="translate(${x} ${y}) scale(${taille})">
  ${jambe('ja sherifPas', -3, -1)}${jambe('jb sherifPas', 3, 1)}
  <path class="c" style="fill:#efe3c8" d="M-5.5 -47 L5.5 -47 L7 -24 L-7 -24 Z"/>
  <path class="c gilet" d="M-5.5 -47 L-1.5 -47 L-2.5 -24 L-7 -24 Z M5.5 -47 L1.5 -47 L2.5 -24 L7 -24 Z"/>
  <line class="ceinture" x1="-6.8" y1="-27" x2="6.8" y2="-27"/>
  <polygon class="etoile" points="-4.5,-42 -3.1,-38.6 0.5,-38.6 -2.3,-36.4 -1.3,-33 -4.5,-35 -7.7,-33 -6.7,-36.4 -9.5,-38.6 -5.9,-38.6"/>
  <path class="s" d="M-5 -44 L-10 -31"/><circle class="c peau" cx="-10" cy="-30" r="2"/>
  ${tete(0, -55, 'moustache')}
  ${chapeau(0, -55, 'chapeauNoir')}
  <g transform="translate(5 -44)"><g class="bras">
    <line class="s" x1="0" y1="0" x2="12" y2="-6"/><circle class="c peau" cx="12" cy="-6" r="2"/>
    <path class="s fin fouet" d="M12 -6 C${12 + r * 0.3} -38 ${12 + r * 0.7} -22 ${portee} 0"/>
  </g></g>
  <g transform="translate(${dx} ${dy})"><g class="impact">
    <path class="choc" d="M98 -50 L106 -60 M102 -40 L114 -42 M98 -30 L106 -20 M92 -54 L92 -64 M94 -26 L90 -16"/>
    <text class="clac" x="108" y="-64">CLAC !</text>
  </g></g>
  ${bulle('sh', -16, -76, ['Grrr !', 'Ha !', 'Hop !'], 4.8, delai + 3, false)}
</g></g>
<style>
  .sherifEntre{animation:sherifEntre 3s ease-out ${delai}s 1 backwards}
  @keyframes sherifEntre{0%{transform:translate(-260px,0px)}100%{transform:translate(0px,0px)}}
  .sherifPas.ja{animation:pas 0.4s linear ${delai}s 7 alternate}
  .sherifPas.jb{animation:pas 0.4s linear ${delai + 0.2}s 7 alternate-reverse}
  @keyframes pas{0%{transform:rotate(-20deg)}100%{transform:rotate(20deg)}}
  .bras{transform-origin:0px 0px;animation:coup 1.6s ease-in ${delai + 3}s infinite backwards}
  @keyframes coup{0%{transform:rotate(-75deg)}35%{transform:rotate(-85deg)}45%{transform:rotate(8deg)}52%{transform:rotate(0deg)}75%{transform:rotate(2deg)}100%{transform:rotate(-75deg)}}
  .impact{opacity:0;animation:clac 1.6s linear ${delai + 3}s infinite}
  @keyframes clac{0%{opacity:0}44%{opacity:0}46%{opacity:1}72%{opacity:1}76%{opacity:0}100%{opacity:0}}
</style>`
}

const dessin = (p: Promeneur) => (p.sorte === 'cheval' ? cheval(p) : p.sorte === 'penseur' ? penseur(p) : virevoltant(p))

function scene(largeur: number, hauteur: number, promeneurs: readonly Promeneur[], sherifEn?: Sherif): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="xMidYMid slice">
<style>
  .s{fill:none;stroke:#5b3a1e;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .fin{stroke-width:1.6}
  .c{stroke:#5b3a1e;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}
  .peau{fill:#f3cba5}
  .oeil{fill:#3a2412}
  .moustache{fill:none;stroke:#3a2412;stroke-width:2.2;stroke-linecap:round}
  .chapeau{fill:#a0693a}
  .chapeauNoir{fill:#3b3b3b}
  .foulard{fill:#d9412b}
  .gilet{fill:#7a4b26}
  .botte{fill:#4a2c16}
  .selle{fill:#8b3a1e}
  .jean{stroke:#3e6596;stroke-width:4.6;stroke-linecap:round}
  .jeanR{fill:none;stroke:#3e6596;stroke-width:4.6;stroke-linecap:round;stroke-linejoin:round}
  .ceinture{stroke:#4a2c16;stroke-width:2}
  .crin{fill:none;stroke:#4a2c16;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
  .patteFond{stroke:#5b3a1e;stroke-width:6.4;stroke-linecap:round}
  .patte{stroke-width:3.4;stroke-linecap:round}
  .sabot{fill:#3a2412}
  .rene{stroke:#5b3a1e;stroke-width:1}
  .etoile{fill:#e0b020;stroke:#8a6508;stroke-width:0.6}
  .choc{fill:none;stroke:#d9480f;stroke-width:2.6;stroke-linecap:round}
  .clac{fill:#d9480f;font:bold 13px sans-serif}
  .bulle{fill:#fff8e7;stroke:#5b3a1e;stroke-width:1.6;stroke-linejoin:round}
  .mot{fill:#b0360c;font:bold 12px sans-serif}
  .hennit{fill:#8a5a2b;font:italic bold 10px sans-serif;animation:clignote 2.6s steps(1,end) infinite}
  .tagada{fill:#a8865e;font:italic 8px sans-serif;opacity:0.8}
  .vent{fill:#a8865e;font:italic 9px sans-serif;animation:clignote 3s steps(1,end) infinite}
  @keyframes clignote{0%{opacity:0}55%{opacity:1}90%{opacity:0}}
  .ja,.jb,.galopA,.galopB,.gratte{transform-box:fill-box}
  .galopA,.galopB,.ja,.jb{transform-origin:50% 0%}
  .galopA{animation:galop 0.5s linear infinite alternate}
  .galopB{animation:galop 0.5s linear infinite alternate-reverse}
  @keyframes galop{0%{transform:rotate(-22deg)}100%{transform:rotate(22deg)}}
  .trot{animation:trot 0.25s ease-in-out infinite alternate}
  @keyframes trot{0%{transform:translate(0px,0px)}100%{transform:translate(0px,-3px)}}
  .lasso{transform-box:fill-box;transform-origin:50% 100%;animation:tourne 0.9s linear infinite}
  .gratte{transform-origin:100% 100%;animation:gratte 0.3s ease-in-out infinite alternate}
  @keyframes gratte{0%{transform:rotate(-14deg)}100%{transform:rotate(12deg)}}
  .roule{transform-box:fill-box;transform-origin:50% 50%;animation:tourne 1.1s linear infinite}
  .rebond{animation:rebond 0.55s ease-out infinite alternate}
  @keyframes rebond{0%{transform:translate(0px,0px)}100%{transform:translate(0px,-12px)}}
  @keyframes tourne{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @media (prefers-color-scheme: dark){.s,.c,.patteFond,.rene{stroke:#f0d9b5}.choc{stroke:#ff8a4c}.clac{fill:#ff8a4c}.bulle{fill:#3a2a1a;stroke:#f0d9b5}.mot{fill:#ffb27a}.hennit,.tagada,.vent{fill:#d9bf98}}
  ${promeneurs.map(css).join('\n  ')}
</style>
${promeneurs.map(dessin).join('')}
${sherifEn ? sherif(sherifEn) : ''}
</svg>`
}

// Derrière toute la conversation dans l'app de bureau : 1000 × 600.
// La colonne de texte occupe à peu près x = 160 à 625. Le shérif se tient dans
// la marge sombre de gauche et le bout de son fouet claque pile au bord gauche
// du texte (x ≈ 160). Les autres restent dans les marges, ou passent en haut
// et en bas de la fenêtre.
// Chacun arrive à son tour : 0 s, 1,5 s (le shérif), 4 s, 7 s, 10 s, 12 s.
export const SCENE_ECRAN = scene(
  1000,
  600,
  [
    { id: 'c1', sorte: 'cheval', y: 125, taille: 0.95, duree: 14, delai: 0, repos: 880, trajet: [[0, -150], [100, 1150]], mots: ['Yiii-haaa !', 'Hue !'], robe: '#b5733a', habit: '#c8553d' },
    { id: 'p1', sorte: 'penseur', y: 330, taille: 1, duree: 18, delai: 4, repos: 665, versLaGauche: true, trajet: [[0, 780], [18, 665], [55, 665], [70, 685], [85, 685], [100, 780]], mots: ['Hmmm…', 'Euh…', 'Gniii…'], habit: '#4a7fb5' },
    { id: 'c2', sorte: 'cheval', y: 525, taille: 0.95, duree: 16, delai: 7, repos: 80, versLaGauche: true, trajet: [[0, 1150], [100, -150]], mots: ['Yahou !', 'Ho-hé !'], robe: '#e6dcc8', habit: '#3f7fbf' },
    { id: 'p2', sorte: 'penseur', y: 485, taille: 1, duree: 20, delai: 10, repos: 108, trajet: [[0, -60], [15, 108], [50, 108], [62, 80], [80, 80], [100, -60]], mots: ['Pfff…', 'Hum ?', 'Mmmh…'], habit: '#5c9e5a' },
    { id: 'v1', sorte: 'virevoltant', y: 560, taille: 1.2, duree: 11, delai: 12, repos: 500, trajet: [[0, -60], [100, 1060]] },
  ],
  { x: 95, y: 300, taille: 1.05, delai: 1.5, portee: 57 },
)

// Sur mobile (écran en hauteur, où l'on ne voit que le milieu de la scène) :
// les personnages restent dans la bande centrale.
export const SCENE_MOBILE = scene(
  1000,
  600,
  [
    { id: 'c1', sorte: 'cheval', y: 140, taille: 1, duree: 14, delai: 0, repos: 600, trajet: [[0, -150], [100, 1150]], mots: ['Yiii-haaa !', 'Hue !'], robe: '#b5733a', habit: '#c8553d' },
    { id: 'p1', sorte: 'penseur', y: 330, taille: 1.1, duree: 18, delai: 4, repos: 600, versLaGauche: true, trajet: [[0, 1080], [18, 600], [55, 600], [70, 630], [85, 630], [100, 1080]], mots: ['Hmmm…', 'Euh…', 'Gniii…'], habit: '#4a7fb5' },
    { id: 'c2', sorte: 'cheval', y: 440, taille: 1, duree: 16, delai: 7, repos: 400, versLaGauche: true, trajet: [[0, 1150], [100, -150]], mots: ['Yahou !', 'Ho-hé !'], robe: '#e6dcc8', habit: '#3f7fbf' },
    { id: 'p2', sorte: 'penseur', y: 500, taille: 1.1, duree: 20, delai: 10, repos: 420, trajet: [[0, -80], [25, 420], [55, 420], [65, 390], [80, 390], [100, -80]], mots: ['Pfff…', 'Hum ?', 'Mmmh…'], habit: '#5c9e5a' },
    { id: 'v1', sorte: 'virevoltant', y: 570, taille: 1.2, duree: 11, delai: 12, repos: 500, trajet: [[0, -60], [100, 1060]] },
  ],
  { x: 380, y: 250, taille: 1.2, delai: 1.5, portee: 95 },
)

// Dans un bandeau (VS Code, qui n'a pas de fond de scène) : 1000 × 140.
export const SCENE_BANDEAU = scene(
  1000,
  140,
  [
    { id: 'rc1', sorte: 'cheval', y: 132, taille: 0.85, duree: 12, delai: 0, repos: 700, trajet: [[0, -150], [100, 1150]], mots: ['Yiii-haaa !', 'Hue !'], robe: '#b5733a', habit: '#c8553d' },
    { id: 'rp1', sorte: 'penseur', y: 132, taille: 0.95, duree: 16, delai: 3, repos: 880, versLaGauche: true, trajet: [[0, 1080], [20, 880], [60, 880], [100, 1080]], mots: ['Hmmm…', 'Euh…'], habit: '#4a7fb5' },
    { id: 'rc2', sorte: 'cheval', y: 132, taille: 0.85, duree: 14, delai: 6, repos: 450, versLaGauche: true, trajet: [[0, 1150], [100, -150]], mots: ['Yahou !', 'Ho-hé !'], robe: '#e6dcc8', habit: '#3f7fbf' },
    { id: 'rv1', sorte: 'virevoltant', y: 134, taille: 0.9, duree: 10, delai: 9, repos: 300, trajet: [[0, -60], [100, 1060]] },
  ],
  { x: 60, y: 132, taille: 0.95, delai: 1.5, portee: 95 },
)

// Un fond vide et transparent, quand personne ne se promène.
export const SCENE_VIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>'
