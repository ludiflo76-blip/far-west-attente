import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'far-west-attente',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: true },
} as const

const FOND = {
  plugin: 'far-west-attente',
  component: 'Backdrop',
  props: { scene: 'far-west', plugin: 'far-west-attente', glass: { blur: 0, opacity: 0.55 } },
} as const

test('terminal : les bonshommes ASCII arrivent presque tout de suite et repartent à la fin', async ($, on) => {
  const clock = mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId ?? 't1' }))
  on('turn.complete', () => ({ text: '' }))

  await $.turn.start({ text: 'salut', turnId: 't1' } as never)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' } as never)
  expect(await ui.find({ type: 'Text', text: /o\// })).toBeUndefined()

  await clock.advance(1_100)
  expect(await ui.find({ type: 'Text', text: /o\// })).toBeDefined()

  // Le shérif entre un peu après le premier cow-boy.
  expect(await ui.find({ type: 'Text', text: /_n_/ })).toBeUndefined()
  await clock.advance(2_000)
  expect(await ui.find({ type: 'Text', text: /_n_/ })).toBeDefined()
  // Le cow-boy crie une onomatopée, pas une phrase.
  expect(await ui.find({ type: 'Text', text: /Hue!|haaa!/ })).toBeDefined()

  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 3_000, isAborted: false } as never)
  expect(await ui.find({ type: 'Text', text: /o\// })).toBeUndefined()
  await ui.unmount()
})

test('bureau : le fond de scène se peuple presque tout de suite, puis se vide', async ($, on) => {
  const clock = mock.clock(on)
  on('turn.start', (_, e) => ({ turnId: e.turnId ?? 't1' }))
  on('turn.complete', () => ({ text: '' }))

  await $.turn.start({ text: 'salut', turnId: 't1' } as never)
  const fond = await $.ui.mount({ ...FOND, surface: 'desktop' } as never)
  const bandeau = await $.ui.mount({ ...BAND, surface: 'desktop' } as never)
  const shérif = async () => {
    const svg = (await fond.find({ type: 'Svg' })) as { props?: { source?: string } } | undefined
    return JSON.stringify(svg ?? {}).includes('CLAC')
  }
  const source = async () => JSON.stringify((await fond.find({ type: 'Svg' })) ?? {})

  expect(await shérif()).toBe(false)
  await clock.advance(1_000)
  expect(await shérif()).toBe(true)
  // Des bulles d'onomatopées, les chevaux qui hennissent, le virevoltant.
  expect(await source()).toContain('Yiii-haaa !')
  expect(await source()).toContain('Hiiiii !')
  expect(await source()).toContain('Fffiouuu')
  // Pas de bandeau sur le bureau : tout se passe derrière la conversation.
  expect(await bandeau.find({ type: 'Svg' })).toBeUndefined()

  await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 1_000, isAborted: false } as never)
  expect(await shérif()).toBe(false)
  await fond.unmount()
  await bandeau.unmount()
})
