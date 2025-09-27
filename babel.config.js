module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Reanimated v4 moved its Babel plugin to react-native-worklets
    plugins: ['react-native-worklets/plugin'],
  };
};