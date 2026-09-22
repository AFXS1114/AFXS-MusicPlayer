const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'music-metadata': path.resolve(__dirname, 'node_modules/music-metadata/lib/core.js'),
  'expo-linking': path.resolve(__dirname, 'node_modules/expo-linking'),
  'expo-constants': path.resolve(__dirname, 'node_modules/expo-constants'),
};


module.exports = config;
