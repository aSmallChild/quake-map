import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        svelte({
            hot: !process.env.VITEST,
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        conditions: ['browser'],
    },
    test: {
        globals: true,
        environment: 'jsdom',
    },
});
