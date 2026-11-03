import { defineConfig } from "vite";

const openBabelFactoryModule = {
    name: 'openbabel-factory-module',
    enforce: 'pre',
    transform(code, id) {
        const normalizedId = id.replace(/\\/g, '/').split('?')[0];
        if (!normalizedId.endsWith('/src/kekule/dist/extra/openbabel.js')) return;

        return code.replace(
            /\nif \(typeof exports === 'object' && typeof module === 'object'\)[\s\S]*$/,
            '\nexport default OpenBabelModule;\n'
        );
    }
};

export default defineConfig(({ mode }) => {
    const standalone = mode === 'standalone';

    return {
        base: './',
        plugins: [openBabelFactoryModule],
        build: standalone ? {
            outDir: 'dist-library',
            lib: {
                entry: 'src/library.ts',
                name: 'LewisStructuresWeb',
                formats: ['iife'],
                fileName: () => 'lewis-structure-canvas.js'
            }
        } : {
            rollupOptions: {
                input: ['index.html'],
                output: {
                    entryFileNames: '[name].js',
                }
            }
        }
    };
});
