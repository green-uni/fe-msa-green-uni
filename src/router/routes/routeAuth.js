const url = 'auth'

export const authRoutes = [
  {
    path: 'login',
    component: () => import('@/views/academic/auth/LogIn.vue'),
    meta: {
      title: '로그인',
    },
  },
  {
    path: `${url}/password`,
    component: () => import('@/views/common/auth/PasswordReset.vue'),
    meta: {
      title: '비밀번호 변경',
    },
  },

]

export const adminAuthRoutes = [
  {
    path: 'login',
    component: () => import('@/views/admin/auth/AdminLogIn.vue'),
    meta: {
      title: '로그인',
    },
  },
]
