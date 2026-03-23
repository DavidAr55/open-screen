import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// __dirname no existe en ESM — se reconstruye así:
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // ── Proceso principal (Node.js + Electron APIs) ──────────────
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        }
      }
    }
  },

  // ── Preload scripts (compilados a out/preload/) ───────────────
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          control:    resolve(__dirname, 'src/preload/control.js'),
          projection: resolve(__dirname, 'src/preload/projection.js'),
        }
      }
    }
  },

  // ── Renderer — dos entradas React independientes ──────────────
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/renderer/shared'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          control:    resolve(__dirname, 'src/renderer/control/index.html'),
          projection: resolve(__dirname, 'src/renderer/projection/index.html'),
        }
      }
    }
  }
})
