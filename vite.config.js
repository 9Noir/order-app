// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa' // <-- 1. Importar

// https://vite.dev/config/
export default defineConfig({
  // base: "/order-app/",
  plugins: [
    vue(),
    tailwindcss(),
    // --- 2. Añadir y Configurar VitePWA ---
    VitePWA({
      // === Registro del Service Worker ===
      // 'autoUpdate' registra e instala el nuevo SW, y lo activa al recargar la página.
      // 'prompt' permite mostrar un aviso al usuario para que actualice manualmente.
      registerType: 'autoUpdate',

      // === Inyección del Registro ===
      // 'auto': El plugin inyecta el código de registro automáticamente. RECOMENDADO.
      // 'script': Necesitas importar 'virtual:pwa-register' en tu main.js.
      // null: Desactiva la inyección, DEBES registrarlo manualmente (como hacías antes, pero adaptado).
      injectRegister: 'auto',

      // === Configuración de Workbox (Generación del SW) ===
      workbox: {
        // Archivos a incluir en el precache (App Shell y assets estáticos)
        // Esto cacheará todos los archivos generados por la build (JS, CSS, HTML, fuentes, etc.)
        // y los assets comunes. Ajusta si tienes tipos de archivo muy específicos.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff,woff2}'],

        // Opcional: Limpieza de precaches antiguos (activado por defecto)
        // cleanupOutdatedCaches: true,

        // Opcional: Ignorar URLs específicas (ej: APIs de desarrollo)
        // navigateFallbackDenylist: [/^\/api/],

        // Opcional: Runtime Caching para APIs o recursos externos
        // Si tu app NO llama a APIs externas y solo usa IndexedDB, esto no es estrictamente necesario.
        /*
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.ejemplo\.com\/.* /, // Patrón para tu API
            handler: 'NetworkFirst', // Estrategia: Intenta red, si falla, usa caché
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50, // Máximo número de entradas
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 Semana
              },
              cacheableResponse: {
                statuses: [0, 200] // Cachear respuestas OK y opacas (CORS)
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/, // Cachear imágenes
            handler: 'CacheFirst', // Estrategia: Sirve de caché, si no está, va a red
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              }
            }
          }
        ]
        */
      },

      // === Manifest (Manifiesto de la App Web) ===
      // Puedes definir el manifest aquí O usar el archivo `public/manifest.json`.
      // Si defines `manifest: {...}` aquí, el plugin lo genera y PUEDES BORRAR `public/manifest.json`.
      // Si quieres usar tu `public/manifest.json` existente (recomendado ya que lo tienes),
      // simplemente NO incluyas la clave `manifest` aquí o pon `manifest: false`.
      // El plugin buscará `public/manifest.json` por defecto si no se define aquí.
      manifest: false, // Descomenta si quieres estar 100% seguro que usa el de /public

      // Opcional: Incluir explícitamente assets de /public que no se referencian directamente
      // Normalmente no es necesario para iconos listados en el manifest.
      // includeAssets: ['favicon.ico', '/img/icon-*.png'],

      // === Opciones de Desarrollo ===
      // Permite probar el SW y PWA en modo desarrollo (`npm run dev`)
      devOptions: {
        enabled: true, // ¡Importante para probar en dev!
        type: 'module', // Necesario para Vite dev server
        /* otros como navigateFallback, etc. */
      }
    })
    // --- Fin de Configuración VitePWA ---
  ],
})