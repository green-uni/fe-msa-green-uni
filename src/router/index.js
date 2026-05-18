import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '@/stores/authentication'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  await authStore.$persistedState?.isReady?.()
  const isLogin = authStore.isLogin
  const role = authStore.role
  const publicPages = ['/login', '/admin/login', '/auth/password']
  const isAdminRole = role === 'ADMIN'
  const isAdminPath = to.path.startsWith('/admin/')

  if (!isLogin && !publicPages.includes(to.path)) {
    next('/login')
    return
  }
  if (isLogin) {
    // 로그인 상태에서 루트·로그인 페이지 접근 시 역할에 맞는 홈으로 리다이렉트
    if (to.path === '/' || to.path === '/login' || to.path === '/admin/login') {
      next(isAdminRole ? '/admin/members/dashboard' : '/members/dashboard')
      return
    }
    // ADMIN이 일반 경로 접근 시 관리자 홈으로 리다이렉트 (비밀번호 변경 제외)
    if (isAdminRole && !isAdminPath && to.path !== '/members/my/password') {
      next('/admin/members/dashboard')
      return
    }
    // 비관리자가 /admin/ 경로 접근 시 로그인 페이지로 리다이렉트
    if (!isAdminRole && isAdminPath) {
      next('/login')
      return
    }

    // meta.auth 기반 접근 제한
    if (to.meta.auth && !to.meta.auth.map(r => r.toUpperCase()).includes(role)) {
      next(isAdminRole ? '/admin/members/dashboard' : '/members/dashboard')
      return
    }
  }
  next()
})

export default router
