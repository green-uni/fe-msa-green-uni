const studentUrl = 'scholarships';
const adminUrl = 'scholarships';

export const scholarshipRoutes = [
  {
    path: studentUrl,
    component: () => import('@/views/academic/scholarship/ScholarshipList.vue'),
    meta: {
      title: '내 장학금 조회',
      groupTitle: '장학금',
      auth: ['STUDENT'],
    },
  },
];

export const adminScholarshipRoutes = [
  {
    path: adminUrl,
    component: () => import('@/views/admin/scholarship/AdminScholarshipList.vue'),
    meta: {
      title: '장학 수혜 학생 조회',
      groupTitle: '장학금 관리',
      auth: ['ADMIN'],
    },
  },
];