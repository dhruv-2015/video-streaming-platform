import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', "./src/**/*.ts"],

  noExternal: [],

  format: ['esm', 'cjs'],
  minify: false,
  dts: true,
  clean: true,
  outDir: 'dist',
});