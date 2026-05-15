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
    // [추가] QR URL로 직접 진입한 경우(token 파라미터 포함) 로그인 후 원래 경로로 돌아올 수 있도록 저장
    sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    next('/login')
    return
  }

  // [추가] meta.auth가 있는 라우트는 해당 Role만 접근 허용
  // Role 불일치 시 역할 구분 없이 /members/my(내 정보 조회)로 리다이렉트
  const requiredRoles = to.meta.auth
  if (isLogin && Array.isArray(requiredRoles) && requiredRoles.length > 0) {
    if (!requiredRoles.includes(authStore.role)) {
      next('/members/my')
      return
    }
  }

  next()
})

export default router
