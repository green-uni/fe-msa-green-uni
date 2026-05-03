const url = 'members'

export const memberRoutes = [
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '내 정보 조회',
      groupTitle: '내 정보 관리',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  {
    path: `${url}/status-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '휴복학 신청서 제출',
      groupTitle: '내 정보 관리',
      auth: ['STUDENT'],
    },
  },
  {
    path: `${url}/major-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '전과/복수전공 신청',
      groupTitle: '내 정보 관리',
      auth: ['STUDENT'],
    },
  },
]

export const adminMemberRoutes = [
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '내 정보 조회',
      groupTitle: '내 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/status-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '인사정보 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/major-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '상태 변경 신청 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '전공 변경 신청 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
]
