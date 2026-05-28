const url = 'schedules'

export const scheduleRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/common/schedule/Schedule.vue'),
    meta: {
      title: '학사 일정',
      groupTitle: '학사 일정',
      navSection: '학사정보',
      auth: ['PROFESSOR', 'STUDENT'],
    },
  },
]

export const adminScheduleRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/common/schedule/Schedule.vue'),
    meta: {
      title: '학사 일정 관리',
      groupTitle: '학사 일정',
      navSection: '학사 관리',
      auth: ['ADMIN'],
    },
  },
]
