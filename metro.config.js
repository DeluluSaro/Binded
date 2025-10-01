const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle missing files gracefully
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add transformer configuration to handle source maps better
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
