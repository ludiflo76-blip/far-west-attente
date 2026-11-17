import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'far-west-attente',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isCollapsed: false, isWorking: true },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`les cow-boys arrivent après 1 min et repartent à la fin (${surface})`, async ($, on) => {
    const clock = mock.clock(on)
    on('turn.start', (_, e) => ({ turnId: e.turnId ?? 't1' }))
    on('turn.complete', () => ({ text: '' }))

    await $.turn.start({ text: 'salut', turnId: 't1' } as never)
    const ui = await $.ui.mount({ ...BAND, surface } as never)
    expect(await ui.find({ type: 'Text', text: /ranch/ })).toBeUndefined()

    await clock.advance(59_000)
    expect(await ui.find({ type: 'Text', text: /ranch/ })).toBeUndefined()

    await clock.advance(2_000)
    expect(await ui.find({ type: 'Text', text: /ranch/ })).toBeDefined()

    await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 61_000, isAborted: false } as never)
    expect(await ui.find({ type: 'Text', text: /ranch/ })).toBeUndefined()
    await ui.unmount()
  })
}
