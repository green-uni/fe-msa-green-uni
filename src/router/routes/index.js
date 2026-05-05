import { authRoutes, adminAuthRoutes } from './routeAuth'
import { memberRoutes, adminMemberRoutes } from './routeMember'

import { lectureRoutes, adminLectureRoutes } from './routeLecture'
import { evaluationRoutes } from './routeEvaluation'
import { scheduleRoutes, adminScheduleRoutes } from './routeSchedule'

import { adminMajorRoutes } from './routeMajor'
import { courseRoutes } from './routeCourse'
import { tuitionRoutes, adminTuitionRoutes } from './routeTuition'
import { scholarshipRoutes, adminScholarshipRoutes } from './routeScholarship'

import { gradeRoutes } from './routeGrade'
import { announcementRoutes, adminAnnouncementRoutes } from './routeAnnouncement'
import { attendanceRoutes, mobileAttendanceRoutes } from './routeAttendance'

export const routes = [
  // 학생/교수 레이아웃
  {
    path: '/',
    component: () => import('@/layouts/AcademicLayout.vue'),
    children: [
      ...authRoutes,
      ...memberRoutes,
      ...lectureRoutes,
      ...evaluationRoutes,
      ...scheduleRoutes,
      ...tuitionRoutes,
      ...courseRoutes,
      ...gradeRoutes,
      ...scholarshipRoutes,
      ...announcementRoutes,
      ...attendanceRoutes,
    ],
  },
  // 관리자 레이아웃
  {
    path: '/admin/',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      ...adminAuthRoutes,
      ...adminMemberRoutes,
      ...adminAnnouncementRoutes,
      ...adminLectureRoutes,
      ...adminScheduleRoutes,
      ...adminMajorRoutes,
      ...adminTuitionRoutes,
      ...adminScholarshipRoutes
    ],
  },
  // 모바일 출석 화면
  {
    path: '/attend',
    component: () => import('@/layouts/AttendanceLayout.vue'),
    children: [
      ...mobileAttendanceRoutes,
    ],
  },
]
