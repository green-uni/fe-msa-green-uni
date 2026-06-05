const courseUrl = 'courses'

export const courseRoutes = [
    {
        path: courseUrl,
        component: () => import('@/views/academic/course/CourseList.vue'),
        meta: {
            title: '수강신청',
            groupTitle: '수강 신청',
            navSection: '학사정보',
            auth: ['STUDENT']
        }
    }
]
