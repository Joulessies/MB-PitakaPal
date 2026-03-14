// Allow plain string values for Tamagui color props
// This is needed because our custom ThemeContext returns plain string colors
// and we use rgba() string values for placeholders

import '@tamagui/core'

declare module '@tamagui/core' {
  interface TamaguiSettings {
    autocomplete?: 'on' | 'off'
  }
}

// Extend Input props to accept string colors
declare module '@tamagui/web' {
  interface ColorTokens extends String {}
}
