/**
 * expo-bundle-wrapper.js
 *
 * Wrapper around @expo/cli used by the Android Gradle build.
 * Ensures Expo CLI runs with apps/mobile/ as its CWD (project root),
 * converts relative --entry-file to an absolute path so Metro doesn't break,
 * and sets NODE_PATH to monorepo node_modules.
 */

const path = require('path');
const fs = require('fs');

// apps/mobile/
const mobileRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(mobileRoot, '..', '..');

// Ensure NODE_PATH contains monorepo node_modules
const monorepoNodeModules = path.join(monorepoRoot, 'node_modules');
const mobileNodeModules = path.join(mobileRoot, 'node_modules');
process.env.NODE_PATH = [mobileNodeModules, monorepoNodeModules, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
require('module').Module._initPaths();

// Convert any relative --entry-file to an absolute path
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--entry-file' && process.argv[i + 1]) {
    const rawPath = process.argv[i + 1];
    if (!path.isAbsolute(rawPath)) {
      // It was relative to mobileRoot
      process.argv[i + 1] = path.resolve(mobileRoot, rawPath);
    }
  }
}

// Switch CWD before Expo CLI reads process.cwd()
process.chdir(mobileRoot);

// Resolve @expo/cli from the monorepo node_modules
const cliEntry = path.resolve(
  monorepoRoot, 'node_modules', '@expo', 'cli', 'build', 'bin', 'cli'
);

require(cliEntry);
