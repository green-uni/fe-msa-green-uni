const url = 'members'

export const memberRoutes = [
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '내 정보 조회',
      groupTitle: '내 정보 관리',
      auth: ['STUDENT', 'PROFESSOR','ADMIN'],
    },
  },
  {
    path: `${url}/edit`,
    component: () => import('@/views/common/member/MemberEdit.vue'),
    meta: {
      title: '내 정보 수정',
      groupTitle: '내 정보 관리',
      showInNav: false,
      activeMenu: `${url}/my`,
      auth: ['STUDENT', 'PROFESSOR','ADMIN'],
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
    path: `${url}/edit`,
    component: () => import('@/views/common/member/MemberEdit.vue'),
    meta: {
      title: '내 정보 수정',
      groupTitle: '내 정보 관리',
      showInNav: false,
      activeMenu: `${url}/my`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/students`,
    component: () => import('@/views/admin/member/AdminStudentList.vue'),
    meta: {
      title: '학생 목록 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/professors`,
    component: () => import('@/views/admin/member/AdminProfessorList.vue'),
    meta: {
      title: '교수 목록 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/admins`,
    component: () => import('@/views/admin/member/AdminAdminList.vue'),
    meta: {
      title: '관리자 목록 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/new`,
    component: () => import('@/views/admin/member/MemberCreate.vue'),
    meta: {
      title: '계정 생성',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/:memberCode`,
    component: () => import('@/views/admin/member/AdminMemberEdit.vue'),
    meta: {
      title: '인사 정보 수정',
      groupTitle: '인사 정보 관리',
      showInNav: false,
      activeMenu: `${url}`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/status-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '상태 변경 신청 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/major-request`,
    component: () => import('@/views/common/BlankPage.vue'),
    meta: {
      title: '전공 변경 신청 조회',
      groupTitle: '인사 정보 관리',
      auth: ['ADMIN'],
    },
  },
]
