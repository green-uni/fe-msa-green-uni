import axios from './httpRequester';

const studentPath = 'core/tuitions';
const adminPath = 'core/admin';

class TuitionService {
  /**
   * API-TUI-01: 학생 - 내 등록금 납부 내역 전체 조회
   */
  getMyTuitionList() {
    return axios.get(`${studentPath}/my`);
  }

  /**
   * API-TUI-03: 학생 - 등록금 납부 상세 조회
   */
  getMyTuitionDetail(tuitionId) {
    return axios.get(`${studentPath}/detail/${tuitionId}`);
  }

  /**
   * API-TUI-07: 학생 - 납부 신청 (상태를 PENDING으로 변경)
   */
  requestPayment(tuitionId) {
    return axios.patch(`${studentPath}/${tuitionId}/pending`);
  }

  /**
   * 🎯 [새로 추가] API-TUI-14-STU: 학생 - 등록금 납부 기간 동적 조회
   */
  getStudentPaymentPeriod() {
    return axios.get(`${studentPath}/payment-period`);
  }

  /**
   * API-TUI-02: 관리자 - 등록금 납부 학생 목록 조회 (페이징 및 필터)
   */
  getTuitionList(year, semester, status, page = 0, size = 10, searchKeyword) {
    const params = { year, semester, page, size, searchKeyword };
    // '전체' 탭이거나 status가 공백이 아니라면 대문자로 변환하여 전송
    if (status && status !== '') {
      params.status = status;
    }
    return axios.get(`${adminPath}/tuitions`, { params });
  }

  /**
   * 추가: 관리자 - 필터용 전체 학과 목록 조회
   */
  getDepartmentList() {
    return axios.get('core/admin/majors'); // 프로젝트의 실제 학과 조회 URL로 맞추어 사용하세요.
  }

  /**
   * API-TUI-05: 관리자 - 등록금 미납자 독촉 메일 미리보기
   */
  previewReminders(year, semester) {
    return axios.get(`${adminPath}/tuitions/reminders/preview`, {
      params: { year, semester }
    });
  }

  /**
   * API-TUI-04: 관리자 - 등록금 미납자 독촉 메일 발송
   */
  sendReminderMails(year, semester) {
    return axios.post(`${adminPath}/tuitions/reminders`, { year, semester });
  }

  /**
   * API-TUI-08: 관리자 - 납부 상태 변경 (완납 승인)
   */
  updateTuitionStatus(tuitionId, status) {
    return axios.patch(`${adminPath}/tuitions/${tuitionId}/paid`, { status });
  }

  /**
   * API-TUI-11: 관리자 - 등록금 책정 정책 전체 조회
   */
  getPolicies() {
    return axios.get(`${adminPath}/tuition-policies`);
  }

  /**
   * API-TUI-12: 관리자 - 등록금 책정 정책 수정
   */
  updatePolicy(policyId, baseAmount) {
    return axios.patch(`${adminPath}/tuition-policies/${policyId}`, { baseAmount });
  }

  /**
   * API-TUI-13: 관리자 - 과거 등록금 정책 이력 조회
   */
  getPolicyHistories(year, semester) {
    return axios.get(`${adminPath}/tuition-policies/history`, {
      params: { year, semester }
    });
  }

  /**
   * API-TUI-14: 관리자 - 등록금 납부 기간 조회
   */
  getPaymentPeriod() {
    return axios.get(`${adminPath}/tuition-schedule/payment-period`);
  }
}

export default new TuitionService();