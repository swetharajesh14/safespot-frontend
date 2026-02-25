const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add MapLibre GL resolver
  config.resolver.alias = {
    ...config.resolver.alias,
    '@maplibre/maplibre-react-native': '@maplibre/maplibre-react-native',
  };

  return config;
})();
