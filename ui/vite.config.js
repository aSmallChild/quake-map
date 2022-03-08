import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
// import replace from '@rollup/plugin-replace';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            '@': path.resolve('/src'),
        },
    },
});
