import ErrorView from '@/views/ErrorView.vue'

export const errorRoutes = [
  {
    path: '/error/forbidden',
    name: 'Forbidden',
    component: ErrorView,
    props: { type: 'forbidden', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/unauthorized',
    name: 'Unauthorized',
    component: ErrorView,
    props: { type: 'unauthorized', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/session',
    name: 'SessionExpired',
    component: ErrorView,
    props: { type: 'session', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/server',
    name: 'ServerError',
    component: ErrorView,
    props: { type: 'server', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/maintenance',
    name: 'Maintenance',
    component: ErrorView,
    props: { type: 'maintenance', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/not-found',
    name: 'NotFound',
    component: ErrorView,
    props: { type: 'not_found', theme: 'sage' },
    meta: { public: true },
  },
  // 404 catch-all — 잘못된 URL 직접 입력 시
  {
    path: '/:pathMatch(.*)*',
    component: ErrorView,
    props: { type: 'not_found', theme: 'sage' },
    meta: { public: true },
  },
]