import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import camelCase from 'lodash.camelcase';
import typescriptPlugin from "rollup-plugin-typescript2";
import autoExternal from "rollup-plugin-auto-external";
import typescript from "typescript";
import json from 'rollup-plugin-json';
import uglify from 'rollup-plugin-uglify';
import replace from 'rollup-plugin-replace';

const pkg = require('./package.json')
const version = process.env.VERSION || pkg.version

const libraryName = 'vuex-lite-sync'

export default {
  input: `src/index.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    { file: pkg.cjs, name: camelCase(libraryName), format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [
    autoExternal(),
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescriptPlugin({ typescript, useTsconfigDeclarationDir: true, objectHashIgnoreUnknownHack: true }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    replace({
      __VERSION__: version
    }),
    // Resolve source maps to the original source
    sourceMaps(),
    (process.env.NODE_ENV === 'production' && uglify()),
  ],
}
