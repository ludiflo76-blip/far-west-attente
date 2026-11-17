export type Frame = number

declare module 'claude-code' {
  interface PluginState {
    'far-west-attente': { isVisible: boolean; frame: Frame }
  }
}
