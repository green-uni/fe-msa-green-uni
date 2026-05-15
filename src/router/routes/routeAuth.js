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
  {
    path: 'members/my/password',
    component: () => import('@/views/common/auth/PasswordChange.vue'),
    meta: {
      title: '비밀번호 변경',
      groupTitle: '내 정보 관리',
      showInNav: false,
      activeMenu: '/member/my',
      auth: ['student', 'professor', 'admin'],
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


export const mobileAuthRoutes = [
  {
    path: 'my/password',
    component: () => import('@/views/common/auth/PasswordChange.vue'),
    meta: {
      title: '비밀번호 변경',
    },
  },
]
