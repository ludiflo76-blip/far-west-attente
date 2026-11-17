import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// Au bout de combien de temps sans réponse visible l'animation apparaît.
const DELAI_MS = 60_000
// Cadence des images ASCII dans le terminal.
const IMAGE_MS = 250

const isVisible = atom({ plugin: 'far-west-attente', key: 'isVisible' } as const, false)
const frame = atom({ plugin: 'far-west-attente', key: 'frame' } as const, 0)

// ---------- Scène SVG (bureau, éditeur, mobile) : animée en SMIL ----------

const cowboy = (x: number, phase: string) => `
<g transform="translate(${x} 0)">
  <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="0.5s" begin="${phase}" repeatCount="indefinite"/>
    <!-- cheval -->
    <path class="s" d="M0 60 H40 L50 45 L60 49 M0 60 L-9 67"/>
    <line class="s" x1="36" y1="60" x2="36" y2="82"><animateTransform attributeName="transform" type="rotate" values="-22 36 60;22 36 60;-22 36 60" dur="0.5s" begin="${phase}" repeatCount="indefinite"/></line>
    <line class="s" x1="40" y1="60" x2="40" y2="82"><animateTransform attributeName="transform" type="rotate" values="22 40 60;-22 40 60;22 40 60" dur="0.5s" begin="${phase}" repeatCount="indefinite"/></line>
    <line class="s" x1="3" y1="60" x2="3" y2="82"><animateTransform attributeName="transform" type="rotate" values="22 3 60;-22 3 60;22 3 60" dur="0.5s" begin="${phase}" repeatCount="indefinite"/></line>
    <line class="s" x1="7" y1="60" x2="7" y2="82"><animateTransform attributeName="transform" type="rotate" values="-22 7 60;22 7 60;-22 7 60" dur="0.5s" begin="${phase}" repeatCount="indefinite"/></line>
    <!-- cow-boy -->
    <circle class="s" cx="20" cy="34" r="5"/>
    <path class="s" d="M12 29 H28 M16 29 V24 H24 V29"/>
    <path class="s" d="M20 39 V58 L13 67 M20 46 L12 52 M20 44 L28 30"/>
    <!-- lasso qui tourne autour de la main -->
    <g>
      <animateTransform attributeName="transform" type="rotate" from="0 28 30" to="360 28 30" dur="0.9s" repeatCount="indefinite"/>
      <line class="s thin" x1="28" y1="30" x2="28" y2="19"/>
      <ellipse class="s thin" cx="28" cy="13" rx="10" ry="6"/>
    </g>
  </g>
</g>`

const penseur = (x: number, phase: string) => `
<g transform="translate(${x} 0)">
  <circle class="s" cx="0" cy="32" r="6"/>
  <path class="s" d="M0 38 V62 L-7 82 M0 62 L7 82 M0 44 L-9 57 M0 44 L10 36"/>
  <!-- avant-bras qui gratte la tête -->
  <line class="s" x1="10" y1="36" x2="6" y2="25"><animateTransform attributeName="transform" type="rotate" values="-14 10 36;10 10 36;-14 10 36" dur="0.3s" begin="${phase}" repeatCount="indefinite"/></line>
  <!-- gribouillis de réflexion -->
  <g>
    <animateTransform attributeName="transform" type="rotate" from="0 0 10" to="360 0 10" dur="2.2s" begin="${phase}" repeatCount="indefinite"/>
    <path class="s thin" stroke-dasharray="60 12" d="M-11 10 c3 -9 9 -9 11 -2 s-9 7 -5 -2 s11 -6 12 1 s-6 8 -9 3 s4 -9 9 -4">
      <animate attributeName="stroke-dashoffset" from="0" to="72" dur="1.1s" repeatCount="indefinite"/>
    </path>
  </g>
</g>`

const cactus = (x: number) =>
  `<path class="c" d="M${x} 82 V52 M${x} 66 h-7 v-8 M${x} 60 h7 v-10"/>`

const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 92" width="540" height="92">
<style>
  .s{fill:none;stroke:#5b3a1e;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .thin{stroke-width:1.5}
  .c{fill:none;stroke:#5f8a4a;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
  .g{stroke:#c9a46a;stroke-width:1.5}
  .sun{fill:#e8a33d;opacity:.8}
  @media (prefers-color-scheme: dark){.s{stroke:#f0d9b5}.g{stroke:#7a6040}.c{stroke:#86b36c}}
</style>
<circle class="sun" cx="500" cy="22" r="11"/>
<line class="g" x1="0" y1="83" x2="540" y2="83"/>
${cactus(150)}${cactus(395)}
${cowboy(30, '0s')}
${penseur(205, '0s')}
${cowboy(270, '0.25s')}
${penseur(460, '0.15s')}
</svg>`

// ---------- Version ASCII (terminal) ----------

const LASSO = ['(_)    ', ' (_)   ', '  (_)  ', ' (_)   ']
const PATTES = [String.raw`  /\ /\ `, String.raw`  || || `]
const BULLE = ['  @~  ', ' ~@   ', '  ?   ', '  ~@~ ']
const BRAS = ['  o/  ', '  o)  ']

const cowboyAscii = (f: number) => [
  LASSO[f % 4] ?? "",
  '   o/  ',
  ' ~=|=< ',
  PATTES[f % 2] ?? "",
]
const penseurAscii = (f: number) => [
  BULLE[f % 4] ?? "",
  BRAS[f % 2] ?? "",
  ' /|   ',
  String.raw` / \  `,
]

const asciiScene = (f: number) => {
  const blocs = [cowboyAscii(f), penseurAscii(f), cowboyAscii(f + 2), penseurAscii(f + 1)]
  return [0, 1, 2, 3].map(i => blocs.map(b => (b[i] ?? "").padEnd(9)).join(''))
}

// ---------- Logique : quand afficher, quand cacher ----------

let attente: { cancel: () => void } | undefined
let images: { cancel: () => void } | undefined

async function cacher($: EngineInterface) {
  attente?.cancel()
  attente = undefined
  images?.cancel()
  images = undefined
  if (await read($, isVisible)) await update($, isVisible, () => false)
}

function armer($: EngineInterface) {
  attente?.cancel()
  attente = $.clock.after(DELAI_MS, () => {
    void update($, isVisible, () => true)
    images?.cancel()
    images = $.clock.every(IMAGE_MS, () => {
      void update($, frame, n => (n + 1) % 1000)
    })
  })
}

export const register: Register = on => {
  // Le compte à rebours démarre avec chaque tour de Claude.
  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e) // un sous-agent : on ignore
    await cacher($)
    armer($)
    return next(e)
  })

  // Dès que du texte de réponse arrive, l'animation disparaît
  // (et le compte à rebours repart, au cas où Claude se remet à réfléchir).
  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) return yield* next(e)
    const flux = next(e)
    let r = await flux.next()
    while (!r.done) {
      const c = r.value
      if (c.kind === 'text' && c.text.trim() !== '') {
        await cacher($)
        armer($)
      }
      yield c
      r = await flux.next()
    }
    return r.value
  })

  // Fin du tour (réponse complète ou interruption) : on range les chevaux.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await cacher($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const visible = await read($, isVisible)
    if (!visible || !e.props.isWorking || e.props.hasSurvey) return next(e)

    const legende = 'Ça cogite au ranch… (plus d’une minute de réflexion)'

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const f = await read($, frame)
      return (
        <Box flexDirection="column">
          {asciiScene(f).map((ligne, i) => (
            <Text key={`l${i}`} color="yellow">{ligne}</Text>
          ))}
          <Text dimColor>{legende}</Text>
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Svg
          source={SCENE}
          alt="Des cow-boys bâtons font tourner leur lasso à cheval pendant que d'autres se grattent la tête"
          isInteractive
        />
        <Text dimColor>{legende}</Text>
      </Box>
    )
  })
}
