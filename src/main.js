import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Opcional: Si usaste registerType: 'prompt', necesitarías importar
// import { registerSW } from 'virtual:pwa-register'
// y luego llamar a registerSW({ onNeedRefresh() { ... }, onOfflineReady() { ... } })
// para manejar los eventos y mostrar tu UI de actualización.
// Con 'autoUpdate', no necesitas hacer nada aquí.