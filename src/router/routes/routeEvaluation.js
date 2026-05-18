const url = 'evaluations'

export const evaluationRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/academic/evaluation/EvaluationList.vue'),
    meta: {
      title: '나의 강의평가',
      groupTitle: '강의 관리',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  {
    path: `${url}/:lectureId`,
    component: () => import('@/views/academic/evaluation/EvaluationDetail.vue'),
    meta: {
      title: '강의평가 상세',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
  {
    path: `${url}/:lectureId/edit`,
    component: () => import('@/views/academic/evaluation/EvaluationCreateEdit.vue'),
    meta: {
      title: '강의평가 작성',
      auth: ['STUDENT'],
    },
  },
]