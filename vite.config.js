import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { env, nodeless } from 'unenv'
const { alias } = env(nodeless)

// remove buffer to fix the issue "could not resolve "./_buffer"
const { buffer: _, ...rest } = alias

export default defineConfig({
    base: './',
    plugins: [
       
      ],
    resolve:{
        alias:{
            ...rest
        }
    },
    build:{
        rollupOptions:{
            output:{
                entryFileNames: '[name].js',
            }
        }
    }
    // plugins: [
    //     {
    //         name: "static-js",
    //         apply: "serve",
    //         enforce: "pre",
    //         resolveId(source, importer) {
    //             if (source === "openBabel.js") {
    //                 return "\ufeff" + source;
    //             }
    //         },
    //     },
    // ],
});
