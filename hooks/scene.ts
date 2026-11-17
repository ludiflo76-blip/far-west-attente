// La scène Far West en SVG : des bonshommes bâtons sur fond transparent,
// qui arrivent l'un après l'autre et se promènent. Animée en CSS seulement.

type Pas = readonly [pourcent: number, x: number]

type Promeneur = {
  id: string
  sorte: 'cheval' | 'penseur'
  y: number
  taille: number
  duree: number
  delai: number
  // Le trajet : en quel pourcentage du cycle il est à quel x.
  trajet: readonly Pas[]
  // Où il reste planté quand l'animation est coupée (mouvement réduit).
  repos: number
  versLaGauche?: boolean
}

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

const cheval = (p: Promeneur) => `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${p.versLaGauche ? -p.taille : p.taille} ${p.taille})">
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
</g></g>`

const penseur = (p: Promeneur) => `
<g class="m${p.id}"><g transform="translate(${p.repos} ${p.y}) scale(${p.versLaGauche ? -p.taille : p.taille} ${p.taille})">
  <circle class="s" cx="0" cy="-52" r="6"/>
  <path class="s" d="M0 -46 V-22 M0 -40 L-9 -27 M0 -40 L10 -48"/>
  <line class="s ja" x1="0" y1="-22" x2="-7" y2="0"/>
  <line class="s jb" x1="0" y1="-22" x2="7" y2="0"/>
  <line class="s gratte" x1="10" y1="-48" x2="6" y2="-59"/>
  <path class="s fin gribouillis" d="M-11 -76 c3 -9 9 -9 11 -2 s-9 7 -5 -2 s11 -6 12 1 s-6 8 -9 3 s4 -9 9 -4"/>
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

function scene(largeur: number, hauteur: number, promeneurs: readonly Promeneur[], sherifEn?: { x: number; y: number; taille: number; delai: number }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="xMidYMid slice">
<style>
  .s{fill:none;stroke:#5b3a1e;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .fin{stroke-width:1.6}
  .etoile{fill:#d4a017;stroke:#8a6508;stroke-width:0.6}
  .choc{fill:none;stroke:#d9480f;stroke-width:2.6;stroke-linecap:round}
  .clac{fill:#d9480f;font:bold 13px sans-serif}
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
  .gribouillis{transform-box:fill-box;transform-origin:50% 50%;stroke-dasharray:60 12;animation:tourne 2.2s linear infinite}
  @keyframes tourne{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  @media (prefers-color-scheme: dark){.s{stroke:#f0d9b5}.choc{stroke:#ff8a4c}.clac{fill:#ff8a4c}}
  ${promeneurs.map(css).join('\n  ')}
</style>
${promeneurs.map(p => (p.sorte === 'cheval' ? cheval(p) : penseur(p))).join('')}
${sherifEn ? sherif(sherifEn.x, sherifEn.y, sherifEn.taille, sherifEn.delai) : ''}
</svg>`
}

// Derrière toute la conversation (app de bureau, mobile) : 1000 × 600.
// Chacun arrive à son tour : 0 s, 1,5 s (le shérif), 4 s, 7 s, 10 s.
export const SCENE_ECRAN = scene(
  1000,
  600,
  [
    { id: 'c1', sorte: 'cheval', y: 110, taille: 1.1, duree: 14, delai: 0, repos: 880, trajet: [[0, -150], [100, 1150]] },
    { id: 'p1', sorte: 'penseur', y: 300, taille: 1.1, duree: 18, delai: 4, repos: 900, versLaGauche: true, trajet: [[0, 1080], [18, 900], [55, 900], [70, 940], [85, 940], [100, 1080]] },
    { id: 'c2', sorte: 'cheval', y: 420, taille: 1.1, duree: 16, delai: 7, repos: 80, versLaGauche: true, trajet: [[0, 1150], [100, -150]] },
    { id: 'p2', sorte: 'penseur', y: 470, taille: 1.1, duree: 20, delai: 10, repos: 110, trajet: [[0, -80], [15, 110], [50, 110], [62, 70], [80, 70], [100, -80]] },
  ],
  { x: 190, y: 250, taille: 1.4, delai: 1.5 },
)

// Dans un bandeau (VS Code, qui n'a pas de fond de scène) : 1000 × 110.
export const SCENE_BANDEAU = scene(
  1000,
  110,
  [
    { id: 'c1', sorte: 'cheval', y: 100, taille: 1, duree: 12, delai: 0, repos: 700, trajet: [[0, -150], [100, 1150]] },
    { id: 'p1', sorte: 'penseur', y: 100, taille: 1, duree: 16, delai: 3, repos: 880, versLaGauche: true, trajet: [[0, 1080], [20, 880], [60, 880], [100, 1080]] },
    { id: 'c2', sorte: 'cheval', y: 100, taille: 1, duree: 14, delai: 6, repos: 450, versLaGauche: true, trajet: [[0, 1150], [100, -150]] },
  ],
  { x: 60, y: 100, taille: 1, delai: 1.5 },
)

// Un fond vide et transparent, quand personne ne se promène.
export const SCENE_VIDE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>'
