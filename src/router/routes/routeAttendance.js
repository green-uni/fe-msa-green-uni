const url = 'attendances'

export const attendanceRoutes = [
// ── 교수 화면 ───────────────────────────────────────────────
  {
    // 교수 강의 목록 화면 (QR 출석 강의 선택 진입점)
    path: `${url}/professor`,
    component: () => import('@/views/attendance/AttendProLectureList.vue'),
    meta: {
      title: '내 강의 목록',
      groupTitle: 'QR 출석 관리',
      auth: ['PROFESSOR'],
    },
  },
  {
    // QR 출석 진행 화면 — 내 강의 목록에서 버튼으로 진입, 사이드바에는 표시 안 함
    // URL 예시: /attendances/42/qr  (42 = lectureId)
    path: `${url}/:lectureId/qr`,
    component: () => import('@/views/attendance/AttendanceQR.vue'),
    meta: {
      title: 'QR 출석 관리',
      groupTitle: 'QR 출석 관리',
      auth: ['PROFESSOR'],
      showInNav: false,
      activeMenu: '/attendances/professor',
    },
  },
  
  {
    // 출석 현황 — 강의 목록 선택 후 날짜별 출석부 조회/수정
    path: `${url}/roster`,
    component: () => import('@/views/attendance/AttendanceList.vue'),
    meta: {
      title: '출석 현황',
      groupTitle: '출석 관리',
      auth: ['PROFESSOR'],
    },
  },
  
  // ── 학생 화면 ───────────────────────────────────────────────

  {
    // 학생 본인 출석 조회 화면 (API-ATTD-04)
    // URL 예시: /attendances/my
    path: `${url}/my`,
    component: () => import('@/views/attendance/AttendanceMyList.vue'),
    meta: {
      title: '내 출석 조회',
      groupTitle: '출석',
      auth: ['STUDENT'],
    },
  },

]

export const mobileAttendanceRoutes = [
  {
    //학생 QR 스캔 출석 체크 화면(API-ATTD-03)
    // 경로: /student/attendances/scan (AttendanceLayout 하위)
    // PWA로 모바일에서 접근하는 화면

    path: 'attendances/scan',
    component: () => import('@/views/attendance/AttendanceScan.vue'),
    meta: {
      title: 'QR 출석 체크',
      auth: ['STUDENT'],
    },
  },
]
