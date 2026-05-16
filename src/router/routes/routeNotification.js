export const notificationRoutes = [
  {
    path: 'notifications',
    component: () => import('@/views/academic/notification/NotificationList.vue'),
    meta: {
      title: '알림',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
]
