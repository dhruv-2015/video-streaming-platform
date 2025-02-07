// import { defineConfig } from 'tsup';

// export default defineConfig({
//   entry: ['src/index.ts', "./src/**/*.ts"],

//   noExternal: ["@aws-sdk/*", "@workspace/*"],

//   format: ['esm', 'cjs'],
//   minify: false,
//   dts: true,
//   clean: true,
//   outDir: 'dist',
//   esbuildOptions: esbuildOptions => {
//     esbuildOptions.alias = {
//         "@": "./src",
//     };
// },
// });

import { defineConfig } from "tsup";

export default defineConfig(options => {
    // options.
    return {
        entry: ["./src/index.ts", "./src/**/*.ts"], // Entry file
        noExternal: ["winston", "winston-daily-rotate-filewww"], // Bundle any package starting with `@example` and their dependencies
        splitting: true,
        bundle: true,
        target: "node22",
        // format: ['esm'],
        // format: ["cjs"],
          format: ['cjs'],
        outDir: "./dist",
        clean: true,
        env: { IS_SERVER_BUILD: "true" },
        loader: { ".json": "copy" },
        treeshake: true,
        metafile: process.env.NODE_ENV !== "production",
        
        // dts: true,
        dts: process.env.NODE_ENV !== "production",
        minify: process.env.NODE_ENV === "production",
        // minify: !options.watch,
        sourcemap: process.env.NODE_ENV !== "production", // Enable sourcemaps .map files
        
        // Add esbuild options to handle path aliases
        esbuildOptions: esbuildOptions => {
            esbuildOptions.alias = {
                "@": "./src",
            };
        },
    };
});
