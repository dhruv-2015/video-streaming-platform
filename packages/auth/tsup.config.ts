import { defineConfig } from "tsup";

export default defineConfig(options => {
    // options.
    return {
        entry: ["./src/index.ts", "./src/**/*.ts"], // Entry file
        noExternal: ["@auth/express"], // Bundle any package starting with `@example` and their dependencies
        splitting: true,
        bundle: true,
        target: "node22",
        // format: ['esm'],
        format: ["cjs"],
        //   format: ['esm','cjs','iife'],
        outDir: "./dist",
        clean: true,
        // treeshake: true,
        // metafile: true,
        
        dts: true,
        minify: false,
        // minify: !options.watch,
        sourcemap: true, // Enable sourcemaps .map files
        

        // Add watch options to include workspace packages
        // watch: !!options.watch
        //     ? [
        //           "./src/**/*.ts",
        //           "../../packages/*/src/**/*.{ts,tsx}", // Watch all TypeScript and TSX files in src directories
        //           "../../packages/*/src/**/schema.prisma", // Watch all workspace packages
        //       ]
        //     : undefined,

        // Add esbuild options to handle path aliases
        esbuildOptions: esbuildOptions => {
            esbuildOptions.alias = {
                "@": "./src",
            };
        },
    };
});
