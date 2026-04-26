const url = 'auth'

export const authRoutes = [

  {
    path: 'login',
    component: () => import('../views/auth/LogIn.vue'),
    meta: {
      title: '로그인',
    },
  },
  {
    path: `${url}/password`,
    component: () => import('../views/auth/PwReset.vue'),
    meta: {
      title: '비밀번호 변경',
    },
  },

]
