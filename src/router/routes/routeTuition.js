const studentUrl = 'tuitions'
const adminUrl = 'admin'

export const tuitionRoutes = [
    {
    path: studentUrl,
    component: () => import('@/views/admin/major/AdminMajorList.vue'),
    meta: {
      title: '등록금 조회',
      groupTitle: '등록금 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${studentUrl}/:majorId/edit`,
    component: () => import('@/views/admin/major/AdminMajorCreateEdit.vue'),
    meta: {
      title: '학과 정보수정',
      groupTitle: '등록금 관리',
      showInNav: false,
      activeMenu: '/admin/majors',
      auth: ['ADMIN'],
    },
  },
]

export const adminTuitionRoutes =[

]
