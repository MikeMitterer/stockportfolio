import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { createLegalAssets } from './scripts/licenseAssets'

/**
 * Version aus der package.json — eine Quelle, kein zweiter Ort zum Pflegen.
 * Landet als Konstante im Bündel und steht damit auch im Container zur
 * Verfügung, wo es keine package.json gibt.
 */
const packageVersion: string = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
).version

/*
 * Ziel der Konto-API für den Dev-Proxy. `make dev-up` setzt VITE_DEV_API_TARGET
 * in Procfile.dev aus `dev-ports --port-of api`; der Port steht nur dort in der
 * Zeile `api` (PORT=…), hier gibt es keine zweite Angabe. Der Teststack setzt
 * das Ziel für seine eigene Konto-API. 127.0.0.1 statt localhost: Node löst
 * localhost womöglich zuerst als ::1 auf.
 */
const apiTarget = process.env.VITE_DEV_API_TARGET

// Einzelstart aus dem Projekt-Root: dev-ports findet Procfile.dev nur dort.
const START_ALONE =
  'VITE_DEV_API_TARGET="http://127.0.0.1:$(dev-ports --port-of api)" npm run dev --prefix frontend'

/**
 * Der Dev-Server startet nicht ohne gültiges Proxy-Ziel. Sonst beantwortet er
 * jede API-Anfrage mit der `index.html`, und der Fehler sieht aus wie eine
 * kaputte Konto-API. Unvollständig ist ein Ziel, das auf `:` endet: So sieht es
 * aus, wenn die Portabfrage mit dev-ports scheitert. Build und Vorschau
 * brauchen kein Ziel.
 */
function requireApiTarget(): Plugin {
  return {
    name: 'stockportfolio-require-api-target',
    apply: (_config, { command, isPreview }) => command === 'serve' && !isPreview,
    configResolved() {
      if (!apiTarget) {
        throw new Error(`VITE_DEV_API_TARGET fehlt. make dev-up setzt es; allein: ${START_ALONE}`)
      }
      if (apiTarget.endsWith(':') || !URL.canParse(apiTarget)) {
        throw new Error(
          `VITE_DEV_API_TARGET unvollständig: "${apiTarget}". Portabfrage im Projekt-Root: ${START_ALONE}`,
        )
      }
    },
  }
}

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion),
  },
  plugins: [vue(), requireApiTarget(), {
    name: 'stockportfolio-license-assets',
    apply: 'build',
    generateBundle() {
      for (const asset of createLegalAssets(fileURLToPath(new URL('..', import.meta.url)))) {
        this.emitFile({ type: 'asset', ...asset })
      }
    },
  }],

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
    exclude: ['@mmit/ux-foundation'],
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
        additionalData: '@use "@mmit/ux-foundation/styles/shared" as *;\n',
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
    // Der Frontend-Port des Dev-Stacks; dev-ports liest ihn hier (Name `frontend`).
    port: 5175,
    strictPort: true,
    // Erlaubt dem Dev-Server, Dateien jenseits des Projektordners
    // auszuliefern — das Fundament liegt als Symlink daneben.
    fs: { allow: ['../..'] },
    proxy: {
      ...(apiTarget ? { '/api': apiTarget } : {}),
    },
  },
  preview: {
    port: 4175,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
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
