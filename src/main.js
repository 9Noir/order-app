import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// --- ELIMINAR TODO ESTE BLOQUE ---
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js') // <-- YA NO ES NECESARIO
        .then(registration => {
            console.log('Service Worker registrado con éxito. Scope:', registration.scope);
            // ... (código de listeners de update, etc.) ...
        })
        .catch(error => {
            console.error('Error al registrar el Service Worker:', error);
        });
  });
  // ... (listener de controllerchange, etc.) ...
} else {
    console.log('Service Worker no es soportado en este navegador.');
}
*/
// --- FIN DEL BLOQUE A ELIMINAR ---

createApp(App).mount('#app')

// Opcional: Si usaste registerType: 'prompt', necesitarías importar
// import { registerSW } from 'virtual:pwa-register'
// y luego llamar a registerSW({ onNeedRefresh() { ... }, onOfflineReady() { ... } })
// para manejar los eventos y mostrar tu UI de actualización.
// Con 'autoUpdate', no necesitas hacer nada aquí.