import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const sharedPath = path.resolve(__dirname, '..', 'shared')
const projectRoot = path.resolve(__dirname)

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@shared': sharedPath,
    },
  },
  server: {
    fs: {
      allow: [projectRoot, sharedPath],
    },
  },
})
