const url = 'evaluations'

export const evaluationRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/academic/evaluation/EvaluationList.vue'),
    meta: {
      title: '나의 강의평가',
      groupTitle: '강의 관리',
      navSection: '학사정보',
      auth: ['STUDENT', 'PROFESSOR'],
    },
  },
]
