import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * Version aus der package.json — eine Quelle, kein zweiter Ort zum Pflegen.
 * Landet als Konstante im Bündel und steht damit auch im Container zur
 * Verfügung, wo es keine package.json gibt.
 */
const packageVersion: string = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
).version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        /*
         * Breakpoint-Mixins und der Farb-Helfer stehen in jeder Komponente
         * zur Verfügung, ohne dass jede SFC dieselbe `@use`-Zeile trägt.
         * Die Datei erzeugt selbst kein CSS — sonst läge sie einmal je
         * Komponente im Bündel.
         */
        additionalData: '@use "@/assets/shared" as *;\n',
      },
    },
  },
  /*
   * Eigene Ports statt der Vite-Vorgaben: Auf 5173 läuft das StockInfo-
   * Dashboard. Mit `strictPort` bricht der Start ab, statt still auf einen
   * anderen Port auszuweichen — sonst zeigt der Browser die falsche App und
   * man sucht den Fehler in der Anwendung.
   */
  server: {
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 4175,
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
