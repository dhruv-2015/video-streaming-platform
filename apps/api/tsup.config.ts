import { defineConfig } from "tsup";

export default defineConfig(options => {
    return {
        entry: ["./src/index.ts"],
        noExternal: ["@workspace"], // Bundle any package starting with `@example` and their dependencies
        splitting: true,
        bundle: true,
        // format: ['esm'],
        format: ["cjs"],
        //   format: ['esm','cjs','iife'],
        outDir: "./dist",
        clean: true,
        env: { IS_SERVER_BUILD: "true" },
        loader: { ".json": "copy" },
        treeshake: true,
        metafile: true,
        dts: true,

          minify: true,
        // minify: !options.watch,
        // sourcemap: true, // Enable sourcemaps .map files

        // Add watch options to include workspace packages
        watch: options.watch ? [
            './src/**/*.ts',
            '../../packages/*/src/**/*.ts',  // Watch all workspace packages
            '../../packages/*/src/**/*.tsx',  // Watch all workspace packages
            '../../packages/*/src/**/schema.prisma',  // Watch all workspace packages
        ] : undefined,

        // Add esbuild options to handle path aliases
        esbuildOptions: esbuildOptions => {
            esbuildOptions.alias = {
                "@": "./src",
            };
        },
    };
});
