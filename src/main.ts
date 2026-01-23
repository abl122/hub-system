import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'
import './styles/admin.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

// Restore authentication session from localStorage BEFORE mounting router
const authStore = useAuthStore()
authStore.restoreSession()

app.use(router)

app.mount('#app')
