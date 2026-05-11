const url = 'lectures'

export const lectureRoutes = [
  {
    path: `${url}`,
    component: () => import('@/views/academic/lecture/LectureCreate.vue'),
    meta: {
      title: '강의개설',
      groupTitle: '강의관리',
      auth: ['PROFESSOR'],
    },
  },
]
export const adminLectureRoutes =[
]
