// import { authRoutes } from './auth'
// import { memberRoutes, adminMemberRoutes } from './member'
// import { lectureRoutes, adminLectureRoutes } from './lecture'
// import { gradeRoutes } from './grade'
// import { courseRoutes } from './course'
// import { adminMajorRoutes } from './major'
// import { calendarRoutes, adminCalendarRoutes } from './calendar'
// import { attendanceRoutes } from './attendance'

export const routes = [
  // 학생/교수 레이아웃
  {
    path: '/',
    component: () => import('@/layouts/AcademicLayout.vue'),
    children: [
      // ...authRoutes,
      // ...memberRoutes,
      // ...calendarRoutes,
      // ...lectureRoutes,
      // ...courseRoutes,
      // ...attendanceRoutes,
      // ...gradeRoutes
    ],
  },
  // 관리자 레이아웃
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      // ...adminMajorRoutes,
      // ...adminMemberRoutes,
      // ...adminCalendarRoutes,
      // ...adminLectureRoutes
    ],
  },
  // 출석 모바일 레이아웃
  // {
  //   path: '/attendance',
  //   component: () => import('@/layouts/AttendanceLayout.vue'),
  //   children: [
  //   ],
  // },
]
