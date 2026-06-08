const url       = 'announcements'
const publicUrl = 'public/announcements'

export const announcementRoutes = [
    // 학생/교수/관리자 공지사항 목록
    {
        path: url,
        component: () => import('@/views/academic/announcement/AnnouncementList.vue'),
        meta: {
            title: '공지사항',
            groupTitle: '공지사항',
            navSection: '커뮤니티',
            auth: ['STUDENT', 'PROFESSOR', 'ADMIN'],
        },
    },
    // 공지사항 상세
    {
        path: `${url}/:annoId`,
        component: () => import('@/views/academic/announcement/AnnouncementDetail.vue'),
        meta: {
            title: '상세',
            subTitle: '공지사항',
            groupTitle: '공지사항',
            navSection: '커뮤니티',
            auth: ['STUDENT', 'PROFESSOR', 'ADMIN'],
            showInNav: false,
            activeMenu: url,
        },
    },
]

export const publicAnnouncementRoutes = [
    {
        path: publicUrl,
        component: () => import('@/views/public/announcement/PublicAnnouncementList.vue'),
        meta: { title: '공지사항', public: true },
    },
    {
        path: `${publicUrl}/:annoId`,
        component: () => import('@/views/public/announcement/PublicAnnouncementDetail.vue'),
        meta: { title: '공지사항 상세', public: true },
    },
]

export const adminAnnouncementRoutes = [
    // 관리자 공지사항 목록
    {
        path: url,
        component: () => import('@/views/admin/announcement/AdminAnnouncementList.vue'),
        meta: {
            title: '공지사항 관리',
            groupTitle: '공지사항',
            navSection: '커뮤니티',
            auth: ['ADMIN'],
        },
    },
    // 관리자 공지사항 등록
    {
        path: `${url}/create`,
        component: () => import('@/views/admin/announcement/AdminAnnouncementCreate.vue'),
        meta: {
            title: '공지사항 등록',
            subTitle: '공지사항 관리',
            groupTitle: '공지사항',
            navSection: '커뮤니티',
            auth: ['ADMIN'],
            showInNav: false,
            activeMenu: url,
        },
    },
    // 관리자 공지사항 수정
    {
        path: `${url}/:annoId`,
        component: () => import('@/views/admin/announcement/AdminAnnouncementCreate.vue'),
        meta: {
            title: '공지사항 수정',
            subTitle: '공지사항 관리',
            groupTitle: '공지사항',
            navSection: '커뮤니티',
            auth: ['ADMIN'],
            showInNav: false,
            activeMenu: url,
        },
    },
]