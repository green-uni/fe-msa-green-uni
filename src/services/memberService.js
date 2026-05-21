import axios from './httpRequester'

class MemberService {
  #adminPath = '/member/admin'
  #path = '/member'

  // 내 정보 조회
  async findProfile(){
    const res = await axios.get(`/member/my`)
    return res.data;
  };

  // 내 정보 수정
  async modifyMyProfile(formData) {
    const res = await axios.patch(`${this.#path}/my`, formData)
    return res.data;
  }

  // 학생 변동 이력 조회
  async findStudentStatus() {
    const res = await axios.get(`${this.#path}/student/history`)
    return res.data;
  }
  // 교수 변동 이력 조회
  async findProfessorStatus() {
    const res = await axios.get(`${this.#path}/professor/history`)
    return res.data;
  }
  // 관리자 변동 이력 조회
  async findAdminStatus() {
    const res = await axios.get(`${this.#path}/admin/history`)
    return res.data;
  }

  //////////////////////// 학생 //////////////////////////

  // 내 전공변경 신청 조회
  async findAllMyMajorRequest() {
    const res = await axios.get(`${this.#path}/student/requests/major`)
    return res.data;
  }
  // 내 전공변경 신청 상세 페이지 조회
  async findMyMajorRequest(requestId) {
    const res = await axios.get(`${this.#path}/student/requests/major/${requestId}`)
    return res.data;
  }
  // 전공 변경 신청서 제출
  async sendMajorRequest(formData) {
    const res = await axios.post(`${this.#path}/student/requests/major`, formData)
    return res.data;
  }
  // 전공 변경 신청 취소
  async cancelMajorRequest(requestId) {
    const res = await axios.delete(`${this.#path}/student/requests/major/${requestId}`)
    return res.data;
  }
  // 전공 변경 신청 서류 다운로드
  async downloadMajorRequestFile(requestId) {
    // responseType: 'blob' — 파일 바이너리를 Blob으로 수신
    const res = await axios.get(
      `${this.#path}/student/requests/major/${requestId}/file`,
      { responseType: 'blob' }
    );

    // Content-Disposition 헤더에서 RFC 5987 인코딩된 파일명 추출
    // 예: Content-Disposition: attachment; filename*=UTF-8''%EC%84%9C%EB%A5%98.pdf
    const disposition = res.headers['content-disposition'];
    let fileName = 'download';
    if (disposition) {
      const match = disposition.match(/filename\*=UTF-8''(.+)/i);
      if (match) fileName = decodeURIComponent(match[1]);
    }

    // 서버 응답의 Content-Type을 Blob에 지정해 브라우저가 파일을 올바르게 해석하도록 함
    const contentType = res.headers['content-type'] || 'application/octet-stream';
    const blob = new Blob([res.data], { type: contentType });

    // Blob URL을 생성해 가상 <a> 태그로 다운로드 트리거
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // click() 직후 즉시 해제하면 브라우저가 다운로드를 큐에 올리기 전에 URL이 사라질 수 있음
    // 짧은 지연 후 해제해 다운로드가 안전하게 시작된 뒤 메모리를 반환
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }


  //////////////////////// 관리자 ////////////////////////

  // 학생 목록 조회
  async findStudents() {
    const res = await axios.get(`${this.#adminPath}/students`)
    return res.data;
  }
  // 교수 목록 조회
  async findProfessors() {
    const res = await axios.get(`${this.#adminPath}/professors`)
    return res.data;
  }
  // 관리자 목록 조회
  async findAdmins() {
    const res = await axios.get(`${this.#adminPath}/admins`)
    return res.data;
  }

  // 계정 생성
  async createStudent(formData) {
    const res = await axios.post(`${this.#adminPath}/students`, formData)
    return res.data;
  }
  async createProfessor(formData) {
    const res = await axios.post(`${this.#adminPath}/professors`, formData)
    return res.data;
  }
  async createAdmin(formData) {
    const res = await axios.post(`${this.#adminPath}/admins`, formData)
    return res.data;
  }

  // 학생 일괄 등록 템플릿 다운로드
  async downloadStudentBatchTemplate() {
    const res = await axios.get(`${this.#adminPath}/students/batch/template`, { responseType: 'blob' })
    return res.data
  }
  // 교수 일괄 등록 템플릿 다운로드
  async downloadProfessorBatchTemplate() {
    const res = await axios.get(`${this.#adminPath}/professors/batch/template`, { responseType: 'blob' })
    return res.data
  }
  // 관리자 일괄 등록 템플릿 다운로드
  async downloadAdminBatchTemplate() {
    const res = await axios.get(`${this.#adminPath}/admins/batch/template`, { responseType: 'blob' })
    return res.data
  }

  // 학생 일괄 등록
  async batchRegisterStudents(formData) {
    const res = await axios.post(`${this.#adminPath}/students/batch`, formData)
    return res.data
  }
  // 교수 일괄 등록
  async batchRegisterProfessors(formData) {
    const res = await axios.post(`${this.#adminPath}/professors/batch`, formData)
    return res.data
  }
  // 관리자 일괄 등록
  async batchRegisterAdmins(formData) {
    const res = await axios.post(`${this.#adminPath}/admins/batch`, formData)
    return res.data
  }

  // 학과 목록 조회
  async getMajorList() {
    const res = await axios.get(`${this.#path}/majors`)
    return res.data;
  }
  // 단과대 목록 조회
  async getCollegeList() {
    const res = await axios.get(`${this.#path}/majors/colleges`)
    return res.data;
  }

  // 관리자의 회원 프로파일 조회
  async getMemberProfile(memberCode) {
    const res = await axios.get(`${this.#adminPath}/${memberCode}`)
    return res.data;
  }
  // 관리자의 학생 계정 변동 이력 조회
  async findStudentStatusByAdmin(memberCode) {
    const res = await axios.get(`${this.#adminPath}/students/${memberCode}/history`)
    return res.data;
  }
  // 관리자의 교수 계정 변동 이력 조회
  async findProfessorStatusByAdmin(memberCode) {
    const res = await axios.get(`${this.#adminPath}/professors/${memberCode}/history`)
    return res.data;
  }
  // 관리자의 관리자 계정 변동 이력 조회
  async findAdminStatusByAdmin(memberCode) {
    const res = await axios.get(`${this.#adminPath}/admins/${memberCode}/history`)
    return res.data;
  }

  // 관리자 계정 개인정보 수정
  async updateAdmin(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/admins/${memberCode}`, formData)
    return res.data;
  }
  // 교수 계정 개인정보 수정
  async updateProfessor(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/professors/${memberCode}`, formData)
    return res.data;
  }
  // 학생 계정 개인정보 수정
  async updateStudent(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/students/${memberCode}`, formData)
    return res.data;
  }

  // 관리자 상태 변경
  async updateAdminStatus(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/admins/${memberCode}/status`, formData)
    return res.data;
  }
  // 교수 상태 변경
  async updateProfessorStatus(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/professors/${memberCode}/status`, formData)
    return res.data;
  }
  // 학생 상태 변경
  async updateStudentStatus(memberCode, formData) {
    const res = await axios.patch(`${this.#adminPath}/students/${memberCode}/status`, formData)
    return res.data;
  }

}

export default new MemberService();
