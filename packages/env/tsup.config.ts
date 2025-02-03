// import { defineConfig } from "tsup";

// export default defineConfig(options => {
//   // options.
//   return {
//     entry: ["./src/index.ts", "./src/**/*.ts"], // Entry file
//     noExternal: [], // Bundle any package starting with `@example` and their dependencies
//     splitting: true,
//     bundle: true,
//     target: "node22",
//     // format: ['esm'],
//     // format: ["cjs"],
//     format: ["esm", "cjs"],
//     outDir: "./dist",
//     clean: true,
//     env: { IS_SERVER_BUILD: "true" },
//     loader: { ".json": "copy" },
//     // treeshake: true,
//     // metafile: true,

//     dts: true,
//     minify: !options.watch,
//     // sourcemap: true, // Enable sourcemaps .map files
//   };
// });


import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', "./src/**/*.ts"],
  format: ['esm', 'cjs'],
  minify: false,
  dts: true,
  clean: true,
  outDir: 'dist',
});