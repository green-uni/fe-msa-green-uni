export const STATUS_LABEL = {
  STUDENT: {
    ENROLLED: '재학',
    ABSENCE: '휴학',
    GRADUATION: '졸업',
    EXPULSION: '퇴학',
    QUIT: '자퇴',
    UNREGISTERED: '미등록',
  },
  PROFESSOR: {
    EMPLOYMENT: '재직',
    SABBATICAL: '안식년',
    ABSENCE: '휴직',
    RETIREMENT: '퇴임',
  },
  ADMIN: {
    EMPLOYMENT: '재직',
    ABSENCE: '휴직',
    RETIREMENT: '퇴사',
  },
}

export const POSITION_LABEL = {
  PROFESSOR: '정교수',
  ASSOCIATE_PROFESSOR: '부교수',
  ASSISTANT_PROFESSOR: '조교수',
  LECTURER: '시간강사',
  EMERITUS_PROFESSOR: '명예교수',
}
export const DEGREE_LABEL = {
  DOCTOR: '박사',
  MASTER: '석사',
}

export const BUILDING_LABEL = {
    HUMANITIES: '인문관',
    ENGINEERING: '공학관',
    NATURAL_SCIENCE: '자연과학관',
    SOCIAL_SCIENCE: '사회과학관',
    BUSINESS: '경영관',
    LAW: '법학관',
    ARTS: '예술관',
    SPORTS: '체육관',
    LIBRARY: '도서관',
    STUDENT_UNION: '학생회관',
    MAIN_BUILDING: '대학본부',
    LAB: '실험동'
}

export const APPROVAL_STATUS = {
  PENDING: '대기', APPROVED: '승인', REJECTED: '반려', CANCELLED: '취소'
}
export const MAJOR_REQUEST_TYPE = {
  MINOR: '부전공', TRANSFER : '전과'
}
export const STATUS_REQUEST_TYPE = {
  ABSENCE: '휴학', RETURN: '복학', QUIT: '자퇴',
}

// 상세 뷰용 뱃지 클래스 (박스 + 색상)
export const BADGE_CLASS = {
  PENDING:   'badge-pending',
  APPROVED:  'badge-approved',
  REJECTED:  'badge-rejected',
  CANCELLED: 'badge-closed',
}

// 목록 카드용 텍스트 색상 클래스
export const TEXT_CLASS = {
  PENDING:   'text-pending',
  APPROVED:  'text-approved',
  REJECTED:  'text-rejected',
  CANCELLED: 'text-closed',
}