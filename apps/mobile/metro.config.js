// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root (chairly/)
const monorepoRoot = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// 1. Watch the monorepo root node_modules and packages
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from monorepo root node_modules first, then app-level
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Ensure the project root is the mobile app directory
config.projectRoot = __dirname;

module.exports = config;
