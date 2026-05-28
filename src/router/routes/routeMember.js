const url = 'members'

export const memberRoutes = [
  {
    path: `${url}/dashboard`,
    component: () => import('@/views/common/member/MemberDashboard.vue'),
    meta: {
      title: '대시보드',
      groupTitle: '대시보드',
      navSection: '홈',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '나의 정보 조회',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      auth: ['STUDENT', 'PROFESSOR','ADMIN'],
    },
  },
  {
    path: `${url}/edit`,
    component: () => import('@/views/common/member/MemberEdit.vue'),
    meta: {
      title: '나의 정보 수정',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: `${url}/my`,
      auth: ['STUDENT', 'PROFESSOR','ADMIN'],
    },
  },
  {
    path: `${url}/my/password`,
    component: () => import('@/views/common/auth/PasswordChange.vue'),
    meta: {
      title: '비밀번호 변경',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: 'my',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  // ------------------ 상태 변경 신청 및 조회 ---------------
  {
    path: `${url}/status-request`,
    component: () => import('@/views/academic/member/StudentStatusRequestList.vue'),
    meta: {
      title: '학적 변동 신청',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      auth: ['STUDENT'],
    },
  },
  {
    path: `${url}/status-request/new`,
    component: () => import('@/views/academic/member/StudentStatusRequestCreate.vue'),
    meta: {
      title: '학적 변동 신청서 제출',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      subTitle: '학적 변동 신청',
      showInNav: false,
      activeMenu: `${url}/status-request`,
      auth: ['STUDENT'],
    },
  },
  // ------------------ 전공 변경 신청 및 조회 ---------------
  {
    path: `${url}/major-request`,
    component: () => import('@/views/academic/member/StudentMajorRequestList.vue'),
    meta: {
      title: '전공 변경 신청',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      auth: ['STUDENT'],
    },
  },
  {
    path: `${url}/major-request/new`,
    component: () => import('@/views/academic/member/StudentMajorRequestCreate.vue'),
    meta: {
      title: '전과/복수전공 신청서 제출',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      subTitle: '전공 변경 신청',
      showInNav: false,
      activeMenu: `${url}/major-request`,
      auth: ['STUDENT'],
    },
  },
]

export const adminMemberRoutes = [
  {
    path: `${url}/dashboard`,
    component: () => import('@/views/common/member/MemberDashboard.vue'),
    meta: {
      showInNav: false,
      title: '대시보드',
      groupTitle: '그린대학교',
      navSection: '홈',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '나의 정보 조회',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/edit`,
    component: () => import('@/views/common/member/MemberEdit.vue'),
    meta: {
      title: '나의 정보 수정',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: `${url}/my`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/my/password`,
    component: () => import('@/views/common/auth/PasswordChange.vue'),
    meta: {
      title: '비밀번호 변경',
      groupTitle: '나의 정보 관리',
      navSection: '나의 정보',
      showInNav: false,
      activeMenu: '/member/my',
      auth: ['ADMIN'],
    },
  },
  // ------------------ 회원 조회 --------------------
  {
    path: `${url}/students`,
    component: () => import('@/views/admin/member/AdminStudentList.vue'),
    meta: {
      title: '학생 목록 조회',
      navTitle: '회원 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      subTitle: '회원 전체 조회',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/professors`,
    component: () => import('@/views/admin/member/AdminProfessorList.vue'),
    meta: {
      title: '교수 목록 조회',
      navTitle: '회원 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      subTitle: '회원 전체 조회',
      showInNav: false,
      activeMenu: `${url}/students`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/admins`,
    component: () => import('@/views/admin/member/AdminAdminList.vue'),
    meta: {
      title: '관리자 목록 조회',
      navTitle: '회원 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      subTitle: '회원 전체 조회',
      showInNav: false,
      activeMenu: `${url}/students`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/:memberCode`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '회원 상세 정보 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      showInNav: false,
      activeMenu: `${url}/students`,
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/:memberCode/edit`,
    component: () => import('@/views/admin/member/AdminMemberEdit.vue'),
    meta: {
      title: '회원 정보 변경',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      showInNav: false,
      activeMenu: `${url}/students`,
      auth: ['ADMIN'],
    },
  },
  // ------------------ 계정 생성 --------------------
  {
    path: `${url}/new`,
    component: () => import('@/views/admin/member/MemberCreate.vue'),
    meta: {
      title: '계정 개별 등록',
      navTitle: '회원 계정 생성',
      subTitle: '회원 계정 생성',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/new/batch`,
    component: () => import('@/views/admin/member/MemberBatchCreate.vue'),
    meta: {
      title: '계정 일괄 등록',
      navTitle: '회원 계정 생성',
      subTitle: '회원 계정 생성',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      showInNav: false,
      activeMenu: `${url}/new`,
      auth: ['ADMIN'],
    },
  },
  // ------------------ 학적 변경 신청 조회 처리 ---------------
  {
    path: `${url}/status-request`,
    component: () => import('@/views/admin/member/AdminStatusRequestList.vue'),
    meta: {
      title: '학적 변경 신청 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/status-request/:requestId`,
    component: () => import('@/views/admin/member/AdminStatusRequestDetail.vue'),
    meta: {
      title: '학적 변경 신청 상세 조회',
      subTitle: '학적 변경 신청 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      showInNav: false,
      activeMenu: `${url}/status-request`,
      auth: ['ADMIN'],
    },
  },
  // ------------------ 전공 변경 신청 조회 처리 ---------------
  {
    path: `${url}/major-request`,
    component: () => import('@/views/admin/member/AdminMajorRequestList.vue'),
    meta: {
      title: '전공 변경 신청 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/major-request/:requestId`,
    component: () => import('@/views/admin/member/AdminMajorRequestDetail.vue'),
    meta: {
      title: '전공 변경 신청 상세 조회',
      subTitle: '전공 변경 신청 조회',
      groupTitle: '회원 정보 관리',
      navSection: '회원 관리',
      showInNav: false,
      activeMenu:`${url}/major-request`,
      auth: ['ADMIN'],
    },
  },
]
