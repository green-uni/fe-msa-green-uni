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
]

export const adminMemberRoutes = [
  {
    path: `${url}/my`,
    component: () => import('@/views/common/member/MemberProfile.vue'),
    meta: {
      title: '관리자의 정보 조회',
      groupTitle: '내 정보 관리',
      auth: ['ADMIN'],
    },
  },
]
