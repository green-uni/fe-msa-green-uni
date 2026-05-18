const courseUrl = 'courses'

export const courseRoutes = [
    {
        path: courseUrl,
        component: () => import('@/views/academic/course/CourseList.vue'),
        meta: {
            title: '수강신청',
            groupTitle: '수강 관리',
            auth: ['STUDENT']
        }
    }
]