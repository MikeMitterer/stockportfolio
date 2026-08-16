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

  /*
   * Das Fundament liegt als `file:`-Abhängigkeit vor — npm legt dafür einen
   * Symlink, Vite sieht also einen Pfad außerhalb des Projekts. Zwei Angaben
   * sind deshalb nötig:
   *
   * `exclude` verhindert das Vorbündeln. Das Paket liefert Quellen aus, und
   * esbuild kann mit `.vue` nichts anfangen — ohne diese Zeile bricht der
   * Dev-Server beim ersten Import ab.
   *
   * `fs.allow` erlaubt dem Dev-Server, Dateien jenseits des Projektordners
   * auszuliefern. Ohne sie antwortet er auf jede Datei des Pakets mit 403.
   *
   * Beides entfällt, sobald das Paket aus der Registry kommt.
   */
  optimizeDeps: {
    exclude: ['@mikemitterer/ux-foundation'],
  },

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
        additionalData: '@use "@mikemitterer/ux-foundation/styles/shared" as *;\n',
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
    // Erlaubt dem Dev-Server, Dateien jenseits des Projektordners
    // auszuliefern — das Fundament liegt als Symlink daneben.
    fs: { allow: ['..'] },
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
