const url = 'attendances'

export const attendanceRoutes = [
]

export const mobileAttendanceRoutes = [
  {
    path: '',
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '전자 출결 시스템 메인',
      auth: ['STUDENT'],
    },
  },
]
