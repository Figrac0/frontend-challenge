/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THE_CAT_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
