import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { SCENE_BANDEAU, SCENE_ECRAN, SCENE_VIDE } from './scene'

// Au bout de combien de temps sans réponse visible les bonshommes arrivent.
const DELAI_MS = 60
// Cadence des images ASCII dans le terminal.
const IMAGE_MS = 250

const isVisible = atom({ plugin: 'far-west-attente', key: 'isVisible' } as const, false)
const frame = atom({ plugin: 'far-west-attente', key: 'frame' } as const, 0)

// ---------- Terminal : des bonshommes ASCII qui traversent le bandeau ----------

const LARGEUR = 70

const LASSO = ['  (_)   ', '   (_)  ', '  (_)   ', ' (_)    ']
const GALOP = [String.raw` /\  /\ `, '  ||  ||']
const GRATTE = ['  o/  ', '  o)  ']
const MARCHE = [String.raw` / \  `, '  |   ']

// Les onomatopées : un mot toutes les 8 images (2 s), puis un silence.
function mot(f: number, mots: readonly string[]): string {
  if (f % 8 >= 6) return ''
  return mots[Math.floor(f / 8) % mots.length] ?? ''
}

const cowboy = (f: number, versLaGauche: boolean, mots: readonly string[]): string[] => {
  const lignes = [LASSO[f % 4] ?? '', '   o/   ', ' ~=|=<  ', GALOP[f % 2] ?? '']
  // La bulle reste à l'endroit, même quand le cow-boy part vers la gauche.
  const bulle = mot(f, mots)
  if (!versLaGauche) return [bulle, ...lignes]
  const miroir: Record<string, string> = { '/': '\\', '\\': '/', '<': '>', '>': '<', '(': ')', ')': '(' }
  return [bulle, ...lignes.map(l => [...l].reverse().map(c => miroir[c] ?? c).join(''))]
}

const penseur = (f: number, marche: boolean, mots: readonly string[]): string[] => [
  '',
  marche ? '' : mot(f, mots),
  marche ? '  o   ' : (GRATTE[f % 2] ?? ''),
  ' /|\\  ',
  marche ? (MARCHE[f % 2] ?? '') : String.raw` / \  `,
]

const SHERIF_ARME = ['  Grrr!', '  _n_   ~~.  ', '   o__/      ', '  <*|        ', String.raw`  / \        `]
const SHERIF_CLAC = ['               CLAC!', String.raw`  _n_          \|/`, '   o              ', '  <*|---~~~~~~ -*-', String.raw`  / \         /|\ `]

const VIREVOLTANT = [' @ ', ' # ']

function poser(grille: string[][], dessin: string[], x: number) {
  dessin.forEach((ligne, y) => {
    ;[...ligne].forEach((c, i) => {
      const col = x + i
      const rang = grille[y]
      if (c !== ' ' && rang && col >= 0 && col < LARGEUR) rang[col] = c
    })
  })
}

// f compte les images depuis l'apparition : chacun entre à son tour.
export function asciiScene(f: number): string[] {
  const grille = [0, 1, 2, 3, 4].map(() => Array.from({ length: LARGEUR }, () => ' '))
  const tour = LARGEUR + 10

  // Cow-boy 1 : entre tout de suite, traverse de gauche à droite.
  poser(grille, cowboy(f, false, ['Yiii-haaa!', 'Hue!', 'Hiiiii!']), ((f * 2) % tour) - 9)

  // Le shérif : entre à l'image 6, se plante à gauche et fouette.
  if (f >= 6) {
    const x = Math.min(0, -18 + (f - 6) * 3)
    const clac = x === 0 && (f - 12) % 4 === 3
    poser(grille, clac ? SHERIF_CLAC : SHERIF_ARME, x)
  }

  // Penseur 1 : entre à l'image 16 par la droite et s'arrête pour réfléchir.
  if (f >= 16) {
    const x = Math.max(LARGEUR - 26, LARGEUR - (f - 16))
    poser(grille, penseur(f, x > LARGEUR - 26, ['Hmmm...', 'Euh...']), x)
  }

  // Cow-boy 2 : entre à l'image 28, traverse de droite à gauche.
  if (f >= 28) poser(grille, cowboy(f, true, ['Yahou!', 'Ho-he!', 'Hiiiii!']), LARGEUR - (((f - 28) * 2) % tour))

  // Penseur 2 : entre à l'image 40 par la droite et s'installe plus loin.
  if (f >= 40) {
    const x = Math.max(LARGEUR - 42, LARGEUR - (f - 40))
    poser(grille, penseur(f + 3, x > LARGEUR - 42, ['Pfff...', 'Hum?']), x)
  }

  // Un virevoltant roule en bas, poussé par le vent.
  if (f >= 50) {
    const x = ((f - 50) * 3) % tour - 3
    poser(grille, ['', '', '', f % 4 < 2 ? 'fffiou~' : '', VIREVOLTANT[f % 2] ?? ''], x)
  }

  return grille.map(r => r.join('').trimEnd())
}

// ---------- Quand afficher, quand cacher ----------

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
    void update($, frame, () => 0)
    void update($, isVisible, () => true)
    images?.cancel()
    images = $.clock.every(IMAGE_MS, () => {
      void update($, frame, n => (n + 1) % 100_000)
    })
  })
}

export const register: Register = on => {
  // Le fond de scène derrière la conversation (app de bureau et mobile) :
  // vide et transparent la plupart du temps, peuplé quand Claude cogite.
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.theme.set({ backdrop: { scene: 'far-west', glass: { blur: 0, opacity: 0.55 } } })
    return r
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== 'far-west-attente') return next(e)
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const { Svg } = $.ui.resolve(e)
    const visible = await read($, isVisible)
    return visible
      ? <Svg source={SCENE_ECRAN} alt="Des cow-boys bâtons galopent en criant yiii-haaa, des bonshommes se grattent la tête et un shérif fouette le texte" isInteractive />
      : <Svg source={SCENE_VIDE} alt="" />
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e) // un sous-agent : on ignore
    await cacher($)
    armer($)
    return next(e)
  })

  // Dès que du texte de réponse arrive, les bonshommes s'en vont
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

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await cacher($)
    return next(e)
  })

  // Le bandeau au-dessus du champ de saisie : seulement là où il n'y a pas
  // de fond de scène (terminal en ASCII, VS Code en dessin).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface === 'desktop' || e.surface === 'mobile') return next(e)
    const visible = await read($, isVisible)
    if (!visible || !e.props.isWorking || e.props.hasSurvey) return next(e)

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      const f = await read($, frame)
      return (
        <Box flexDirection="column">
          {asciiScene(f).map((ligne, i) => (
            <Text key={`l${i}`} color="yellow">{ligne === '' ? ' ' : ligne}</Text>
          ))}
        </Box>
      )
    }

    const { Svg } = $.ui.resolve(e)
    return (
      <Svg
        source={SCENE_BANDEAU}
        alt="Des cow-boys bâtons galopent en criant yiii-haaa, des bonshommes se grattent la tête et un shérif fouette le texte"
        height={140}
        isInteractive
      />
    )
  })
}
