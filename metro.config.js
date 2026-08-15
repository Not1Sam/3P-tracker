const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite web
config.resolver.assetExts.push('wasm');

// Stub .css imports by resolving them to an empty JS module
const emptyCssStub = path.join(__dirname, 'empty-css-stub.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.endsWith('.css') ||
    moduleName.endsWith('.module.css')
  ) {
    return { filePath: emptyCssStub, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
