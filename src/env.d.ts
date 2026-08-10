/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

/** Von Vite zur Bauzeit eingesetzt — siehe `define` in der vite.config.ts. */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_STOCKINFO_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
