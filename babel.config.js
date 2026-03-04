module.exports = function (api) {
  api.cache(true)
  const plugins = [
    [
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
        disableExtraction: process.env.NODE_ENV === 'development',
      },
    ],
    'react-native-reanimated/plugin', // must be last
  ]
  return {
    presets: ['babel-preset-expo'],
    plugins,
  }
}
