// @ts-check
import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  site: SITE.url.value,
  trailingSlash: 'always',
  // Keeps dev screenshots free of the toolbar overlay.
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  vite: {
    // Treat 3D model and GPU texture files as static assets when imported.
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx2'],
    build: {
      // Fonts are tiny subsets; keep them as files so they cache and preload, never inline them.
      assetsInlineLimit: 0,
    },
  },
});
