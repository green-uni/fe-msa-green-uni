const url = 'attendances'

export const attendanceRoutes = [
// ── 교수 화면 ───────────────────────────────────────────────

  {
    // QR 출석 진행 화면 (이번에 만든 컴포넌트)
    // URL 예시: /attendances/42/qr  (42 = lectureId)
    path: `${url}/:lectureId/qr`,
    component: () => import('@/views/attendance/AttendanceQR.vue'),
    meta: {
      title: 'QR 출석 관리',
      groupTitle: 'QR 출석 관리',
      auth: ['PROFESSOR'],
    },
  },
  {
    // 출석 현황 조회 + 수정 화면 (API-ATTD-05, 06)
    // URL 예시: /attendances/42
    path: `${url}/:lectureId`,
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
    // 경로: /attend/scan (AttendanceLayout 하위)
    // PWA로 모바일에서 접근하는 화면

    path: 'scan',
    component: () => import('@/views/attendance/AttendanceScan.vue'),
    meta: {
      title: 'QR 출석 체크',
      auth: ['STUDENT'],
    },
  },
]
