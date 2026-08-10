import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Startet den Dev-Server neu, wenn sich die Tailwind- oder PostCSS-Konfiguration
 * ändert.
 *
 * PostCSS liest beide Dateien einmal beim Start. Ohne diesen Neustart läuft ein
 * bereits laufender Server mit der alten Konfiguration weiter — der Build ist
 * dann korrekt, die Live-Ansicht aber nicht. Das hat schon zweimal zu
 * Fehlersuche am falschen Ende geführt (fehlende Farb-Utilities, abgeschaltetes
 * Preflight).
 */
function restartOnStyleConfigChange(): Plugin {
  const watched = ['tailwind.config.ts', 'postcss.config.js']

  return {
    name: 'restart-on-style-config-change',
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', (file: string) => {
        if (watched.some((name) => file.endsWith(name))) {
          server.config.logger.info(
            `\n[config] ${file.split('/').pop()} geändert — Dev-Server startet neu.`,
          )
          void server.restart()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), restartOnStyleConfigChange()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia', 'vue-i18n'],
          'vendor-ui': ['naive-ui'],
        },
      },
    },
  },
})
