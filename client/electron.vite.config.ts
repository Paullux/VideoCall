import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Charge TOUTES les vars du .env (préfixe vide = pas de filtre)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        'import.meta.env.KINDE_DOMAIN': JSON.stringify(env.KINDE_DOMAIN ?? ''),
        'import.meta.env.KINDE_CLIENT_ID': JSON.stringify(env.KINDE_CLIENT_ID ?? ''),
        'import.meta.env.SIGNALING_URL': JSON.stringify(env.SIGNALING_URL ?? ''),
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      plugins: [react()],
    },
  }
})
