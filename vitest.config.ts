import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.ts', 'tests/integration/**/*.{test,spec}.ts'],
    alias: {
      $lib: path.resolve(__dirname, './src')
    }
  }
});
