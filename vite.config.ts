import { defineConfig } from 'vite'

export default defineConfig({
  // relative base so builds run from itch.io zips and any static host
  base: './',
  server: {
    port: 5190,
  },
})
