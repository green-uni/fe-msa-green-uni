import axios from './httpRequester'
import { downloadBlobFile } from '@/utils/fileDownload'

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
  async downloadMyMajorRequestFile(requestId) {
    await downloadBlobFile(axios, `${this.#path}/student/requests/major/${requestId}/file`);
  }
  // 전공 변동 이력 조회
  async findMyMajorChange() {
    const res = await axios.get(`${this.#path}/student/history/major`)
    return res.data;
  }

  // 내 학적 변동 신청 목록 조회
  async findAllMyStatusRequests() {
    const res = await axios.get(`${this.#path}/student/requests/status`)
    return res.data;
  }
  // 내 학적 변동 신청 상세 조회
  async findMyStatusRequest(requestId) {
    const res = await axios.get(`${this.#path}/student/requests/status/${requestId}`)
    return res.data;
  }
  // 학적 변동 신청서 제출
  async sendStatusRequest(formData) {
    const res = await axios.post(`${this.#path}/student/requests/status`, formData)
    return res.data;
  }
  // 학적 변동 신청 취소
  async cancelStatusRequest(requestId) {
    const res = await axios.delete(`${this.#path}/student/requests/status/${requestId}`)
    return res.data;
  }
  // 학적 변동 신청 서류 다운로드
  async downloadMyStatusRequestFile(requestId) {
    await downloadBlobFile(axios, `${this.#path}/student/requests/status/${requestId}/file`);
  }


  //////////////////////// 관리자 ////////////////////////

  // 학생 목록 조회
  async findStudents(params = {}) {
    const res = await axios.get(`${this.#adminPath}/students`, { params })
    return res.data;
  }
  // 교수 목록 조회
  async findProfessors(params = {}) {
    const res = await axios.get(`${this.#adminPath}/professors`, { params })
    return res.data;
  }
  // 관리자 목록 조회
  async findAdmins(params = {}) {
    const res = await axios.get(`${this.#adminPath}/admins`, { params })
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

  // 전공변경 신청서 전체 조회
  async findAllMajorRequests(params = {}) {
    const res = await axios.get(`${this.#adminPath}/requests/major`, { params })
    return res.data;
  }
  // 전공변경 신청서 단건 조회
  async findMajorRequest(requestId) {
    const res = await axios.get(`${this.#adminPath}/requests/major/${requestId}`)
    return res.data;
  }
  // 전공변경 신청서 승인/반려
  async processMajorRequest(requestId, formData) {
    const res = await axios.patch(`${this.#adminPath}/requests/major/${requestId}`, formData)
    return res.data;
  }
  // 전공 변경 신청 서류 다운로드
  async downloadMajorRequestFile(requestId) {
    await downloadBlobFile(axios, `${this.#adminPath}/requests/major/${requestId}/file`);
  }
  // 학생의 전공 변동 이력 조회
  async findMajorChange(memberCode) {
    const res = await axios.get(`${this.#adminPath}/students/${memberCode}/history/major`)
    return res.data;
  }

  // 학적 변동 신청서 전체 조회 (관리자)
  async findAllStatusRequests(params = {}) {
    const res = await axios.get(`${this.#adminPath}/requests/status`, { params })
    return res.data;
  }
  // 대시보드 - 계정 현황 카운트
  async getDashboardCounts() {
    const res = await axios.get(`${this.#adminPath}/counts`)
    return res.data
  }

  // 대시보드 - 학생 본인 신청서 목록 (전공+학적 통합, 최대 3건)
  async getDashboardStudentRequests() {
    const res = await axios.get(`${this.#path}/student/requests/dashboard`, {
      params: { size: 4 }
    })
    return res.data
  }

  // 대시보드 - 전공변경 신청 대기 목록 (최대 5건)
  async getDashboardMajorRequests() {
    const res = await axios.get(`${this.#adminPath}/requests/major`, {
      params: { status: 'PENDING', size: 6, page: 1 }
    })
    const page = res.data?.data ?? {}
    return { data: page.content ?? [], total: Number(page.totalElements) || 0 }
  }

  // 대시보드 - 학적변경 신청 대기 목록 (최대 5건, 전체 유형)
  async getDashboardStatusRequests() {
    const res = await axios.get(`${this.#adminPath}/requests/status`, {
      params: { status: 'PENDING', size: 6, page: 1 }
    })
    const page = res.data?.data ?? {}
    return { data: page.content ?? [], total: Number(page.totalElements) || 0 }
  }

  // 학적 변동 신청서 단건 조회 (관리자)
  async findStatusRequest(requestId) {
    const res = await axios.get(`${this.#adminPath}/requests/status/${requestId}`)
    return res.data;
  }
  // 학적 변동 신청서 승인/반려 (관리자)
  async processStatusRequest(requestId, data) {
    const res = await axios.patch(`${this.#adminPath}/requests/status/${requestId}`, data)
    return res.data;
  }
  // 학적 변동 신청 서류 다운로드 (관리자)
  async downloadStatusRequestFile(requestId) {
    await downloadBlobFile(axios, `${this.#adminPath}/requests/status/${requestId}/file`);
  }

}

export default new MemberService();
