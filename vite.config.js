import { defineConfig } from "vite";
import { env, nodeless } from 'unenv'
const { alias } = env(nodeless)
import { viteStaticCopy } from 'vite-plugin-static-copy'

// remove buffer to fix the issue "could not resolve "./_buffer"
const { buffer: _, ...rest } = alias

export default defineConfig({
    base: './',
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: ["./src/openbabel.js", "./src/openbabel.wasm", "./src/openbabel.data"],
                    dest: '.'
                }
            ]
        })
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
