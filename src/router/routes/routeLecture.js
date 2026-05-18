const url = 'lectures'

export const lectureRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/common/lecture/LectureList.vue'),
    meta: {
      title: '강의 전체 조회',
      groupTitle: '강의 관리',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  {
    path: `${url}/my`,
    component: () => import('@/views/academic/lecture/MyLectureList.vue'),
    meta: {
      title: '나의 강의 관리',
      groupTitle: '강의 관리',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },

  {
    path: `${url}/create`,
    component: () => import('@/views/academic/lecture/LectureCreate.vue'),
    meta: {
      title: '강의 개설',
      groupTitle: '강의 관리',
      auth: ['PROFESSOR'],
    },
  },
  {
  path: `${url}/edit/:lectureId`,
  component: () => import('@/views/academic/lecture/LectureCreate.vue'),
  meta: {
    title: '강의 수정',
    auth: ['PROFESSOR'],
  },
},
  {
    path: `${url}/:lectureId`,
    component: () => import('@/views/common/lecture/LectureDetail.vue'),
    meta: {
      title: '강의 상세',
      auth: ['PROFESSOR', 'STUDENT'],
    },
  },
]

export const adminLectureRoutes = [
  {
    path: `${url}/my`,
    component: () => import('@/views/admin/lecture/LectureApproveList.vue'),
    meta: {
      title: '강의 승인 관리',
      groupTitle: '강의 관리',
      auth: ['ADMIN'],
    },
  },
    {
    path: `${url}`,
    component: () => import('@/views/common/lecture/LectureList.vue'),
    meta: {
      title: '강의 전체 조회',
      groupTitle: '강의 관리',
      auth: ['ADMIN'],
    },
  },
  {
    path: `${url}/:lectureId`,
    component: () => import('@/views/common/lecture/LectureDetail.vue'),
    meta: {
      title: '강의 상세',
      auth: ['ADMIN'],
    },
  },
]