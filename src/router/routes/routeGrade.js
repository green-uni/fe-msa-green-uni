// [추가] 성적 관련 라우트 — 브라우저 URL을 API 경로 규칙과 통일
const url = 'grades'

export const gradeRoutes = [
    // ── 교수 화면 ─────────────────────────────────────────────
    {
        // 강의 목록 — 사이드바 "성적 > 성적 관리" 진입점
        // 브라우저: /professor/grades
        path: `professor/${url}`,
        component: () => import('@/views/academic/grade/GradeProfLectures.vue'),
        meta: {
            title: '성적 관리',
            groupTitle: '성적',
            auth: ['PROFESSOR'],
        },
    },
    {
        // 강의별 성적 입력/수정 화면
        // 브라우저: /professor/grades/{lectureId}
        path: `professor/${url}/:lectureId`,
        component: () => import('@/views/academic/grade/GradeManagement.vue'),
        meta: {
            title: '성적 관리',
            groupTitle: '성적',
            auth: ['PROFESSOR'],
            showInNav: false,
            activeMenu: `professor/${url}`,
        },
    },

    // ── 학생 화면 ─────────────────────────────────────────────
    {
        // 학생 본인 성적 조회
        // 브라우저: /grades
        path: url,
        component: () => import('@/views/academic/grade/GradeStudentList.vue'),
        meta: {
            title: '내 성적 조회',
            groupTitle: '성적',
            auth: ['STUDENT'],
        },
    },
]