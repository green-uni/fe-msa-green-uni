const adminUrl = 'majors'

export const adminMajorRoutes = [
  {
    path: adminUrl,
    component: () => import('@/views/admin/major/AdminMajorList.vue'),
    meta: {
      title: '학과 조회',
      groupTitle: '학과 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${adminUrl}/new`,
    component: () => import('@/views/admin/major/AdminMajorCreateEdit.vue'),
    meta: {
      title: '학과 개설',
      groupTitle: '학과 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${adminUrl}/:majorId/edit`,
    component: () => import('@/views/admin/major/AdminMajorCreateEdit.vue'),
    meta: {
      title: '학과 정보수정',
      groupTitle: '학과 관리',
      showInNav: false,
      activeMenu: '/admin/majors',
      auth: ['ADMIN'],
    },
  },
]