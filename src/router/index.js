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
  const publicPages = ['/login', '/admin/login', '/auth/password', '/student/login']
  const isAdminRole = role === 'ADMIN'
  const isAdminPath = to.path.startsWith('/admin/')

  // 모바일 학생: /student/* 경로와 /student/login만 허용 — PC 레이아웃 접근 차단
  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  if (!isMobileDevice && to.path === '/student/login') {
    next('/login')
    return
  }
  if (isMobileDevice && to.path === '/login') {
    next('/student/login')
    return
  }
  if (isMobileDevice && isLogin && role === 'STUDENT' && !to.path.startsWith('/student/')) {
    next('/student/attendances/home')
    return
  }

  if (!isLogin && !publicPages.includes(to.path) && !to.meta.public) {
    next(isMobileDevice ? '/student/login' : '/login')
    return
  }
  if (isLogin) {
    // 로그인 상태에서 루트·로그인 페이지 접근 시 역할에 맞는 홈으로 리다이렉트
    if (to.path === '/' || to.path === '/login' || to.path === '/admin/login' || to.path === '/student/login') {
      next(isMobileDevice ? '/student/attendances/home' : isAdminRole ? '/admin/members/dashboard' : '/members/dashboard')
      return
    }
    // ADMIN이 일반 경로 접근 시 관리자 홈으로 리다이렉트 (비밀번호 변경 제외)
    if (isAdminRole && !isAdminPath && !to.meta.public && to.path !== '/members/my/password') {
      next('/admin/members/dashboard')
      return
    }
    // 비관리자가 /admin/ 경로 접근 시 로그인 페이지로 리다이렉트
    if (!isAdminRole && isAdminPath) {
      next('/login')
      return
    }

    // meta.auth가 있는 라우트는 해당 Role만 접근 허용
    if (Array.isArray(to.meta.auth) && to.meta.auth.length > 0 && !to.meta.auth.includes(role)) {
      next(isAdminRole ? '/admin/members/dashboard' : '/members/dashboard')
      return
    }
  }
  next()
})

export default router
