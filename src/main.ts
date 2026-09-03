import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import { authGuard } from './core/router/guards.ts'
import { router } from './core/router/route.ts'

const app = createApp(App)
const pinia = createPinia()

// 1. Pinia harus didaftarkan sebelum router
//    karena guards.ts menggunakan store (useAuthStore, useMerchantStore)
app.use(pinia)

// 2. Daftarkan guard ke router
//    SETELAH pinia.use() agar store bisa dipakai di dalam guard
router.beforeEach(authGuard)

// 3. Daftarkan router ke app
app.use(router)

app.mount('#app')