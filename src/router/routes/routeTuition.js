const studentUrl = 'tuitions'

export const tuitionRoutes = [
  {
    path: `${studentUrl}/my`,
    component: () => import('@/views/academic/tuition/TuitionList.vue'),
    meta: {
      title: '등록금 납부 내역',
      groupTitle: '등록금',
      navSection: '나의 정보',
      auth: ['STUDENT'],
    },
  },
  {
    path: `${studentUrl}/:tuitionId`,
    component: () => import('@/views/academic/tuition/Tuition.vue'),
    meta: {
      title: '등록금 납부',
      groupTitle: '등록금',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: `${studentUrl}/my`,
      auth: ['STUDENT'],
    },
  },
  {
    path: `${studentUrl}/:tuitionId/pending`,
    component: () => import('@/views/academic/tuition/Tuition.vue'),
    meta: {
      title: '등록금 납부',
      groupTitle: '등록금',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: '/tuitions',
      auth: ['STUDENT'],
    },
  },
]

export const adminTuitionRoutes = [
  {
    path: 'tuition',
    component: () => import('@/views/admin/tuition/AdminTuition.vue'),
    meta: {
      title: '학생 목록 조회',
      groupTitle: '등록금 관리',
      navSection: '재정 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: 'tuition-policy',
    component: () => import('@/views/admin/tuition/AdminTuitionPolicy.vue'),
    meta: {
      title: '등록금 정책 관리',
      groupTitle: '등록금 관리',
      navSection: '재정 관리',
      auth: ['ADMIN'],
    },
  },
]
