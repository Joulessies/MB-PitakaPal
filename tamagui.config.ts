import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from '@tamagui/core'

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  shorthands: {} as any,
  settings: {
    ...defaultConfig.settings,
    // Allow any string color values alongside tokens
    allowedStyleValues: 'somewhat-strict-web',
  },
})

export default tamaguiConfig

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
