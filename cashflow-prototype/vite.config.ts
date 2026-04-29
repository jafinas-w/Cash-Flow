import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The .canvas.tsx prototype files live in `../prototypes/`, outside this Vite
// project. Files outside the project root resolve bare imports against
// whatever node_modules sits closest to them — which is none, since
// `prototypes/` has no package.json. We force every bare dependency
// V2 uses to resolve against this project's node_modules instead.
const proto = (pkg: string) => ({
  find: pkg,
  replacement: path.resolve(__dirname, 'node_modules', pkg),
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      proto('react'),
      proto('react-dom'),
      proto('react-dom/client'),
      proto('react/jsx-runtime'),
      proto('react/jsx-dev-runtime'),
      proto('lucide-react'),
    ],
  },
  server: {
    fs: {
      // Allow Vite to serve files from the parent directory (where
      // `prototypes/` lives) in dev mode.
      allow: [path.resolve(__dirname, '..')],
    },
  },
  optimizeDeps: {
    // Pre-bundle lucide-react so it works for the external file too.
    include: ['lucide-react'],
  },
})
