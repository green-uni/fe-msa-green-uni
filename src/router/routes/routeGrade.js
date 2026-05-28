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
            navSection: '학사정보',
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
    {
        // 교수 이의신청 목록
        // 브라우저: /professor/grades/appeals
        path: `professor/${url}/appeals`,
        component: () => import('@/views/academic/grade/GradeAppealProList.vue'),
        meta: {
            title: '성적 이의신청 목록',
            groupTitle: '성적',
            navSection: '학사정보',
            auth: ['PROFESSOR'],
        },
    },
    {
        // 교수 이의신청 상세
        // 브라우저: /professor/grades/appeals/{courseId}
        path: `professor/${url}/appeals/:courseId`,
        component: () => import('@/views/academic/grade/GradeAppealProDetail.vue'),
        meta: {
            title: '성적 이의신청 상세',
            groupTitle: '성적',
            auth: ['PROFESSOR'],
            showInNav: false,
            activeMenu: `professor/${url}/appeals`,
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
            navSection: '학사정보',
            auth: ['STUDENT'],
        },
    },
    {
        // 학생 전체 성적 상세조회
        // 브라우저: /grades/detail
        path: `${url}/detail`,
        component: () => import('@/views/academic/grade/GradeStudentDetail.vue'),
        meta: {
            title: '성적 상세 조회',
            groupTitle: '성적',
            auth: ['STUDENT'],
            showInNav: false,
            activeMenu: url,
        },
    },
    {
        // 학생 이의신청 내역 조회
        // 브라우저: /grades/appeals/my
        path: `${url}/appeals/my`,
        component: () => import('@/views/academic/grade/GradeAppealStuList.vue'),
        meta: {
            title: '성적 이의신청 내역',
            groupTitle: '성적',
            navSection: '학사정보',
            auth: ['STUDENT'],
        },
    },
    {
        // 성적 이의신청
        // 브라우저: /grades/:gradeId/appeal
        path: `${url}/:gradeId/appeal`,
        component: () => import('@/views/academic/grade/GradeAppeal.vue'),
        meta: {
            title: '성적 이의신청',
            groupTitle: '성적',
            auth: ['STUDENT'],
            showInNav: false,
            activeMenu: url,
        },
    },
]