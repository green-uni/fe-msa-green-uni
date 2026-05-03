import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/authentication'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  await authStore.$persistedState?.isReady?.()
  const isLogin = authStore.isLogin
  const publicPages = ['/login', '/admin/login', '/auth/password']

  if (!isLogin && !publicPages.includes(to.path)) {
    next('/login')
    return
  }

  next()
})

export default router
