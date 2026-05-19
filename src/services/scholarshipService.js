import axios from './httpRequester';

const studentPath = 'core/scholarships';
const adminPath = 'core/admin/scholarships';

class ScholarshipService {
  // API-SCH-02: 학생 - 내 장학금 목록 조회
  getMyScholarships(page = 0, size = 10) {
    return axios.get(`${studentPath}/my`, { params: { page, size } });
  }

  // API-SCH-01: 관리자 - 장학 수혜 학생 목록 조회
  getScholarshipList(year, semester, page = 0, size = 10) {
    return axios.get(adminPath, { params: { year, semester, page, size } });
  }

  // 테스트용 장학금 배정 (임시)
  assignTest(year, semester) {
    return axios.post(`${adminPath}/assign-test`, null, { params: { year, semester } });
  }
}

export default new ScholarshipService();