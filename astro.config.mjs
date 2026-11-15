// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  output: 'static',
  vite: {
    // Treat 3D model and GPU texture files as static assets when imported.
    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx2'],
  },
});
