import axios from './httpRequester'

class MemberService {
  #adminPath = '/member/admin'
  #path = '/member'

  // 내 정보 조회
  async findProfile(){
    const res = await axios.get(`${this.#path}/my`)
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

  //////////////////////// 관리자 ////////////////////////

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

  // 학과 목록 조회
  async getMajorList() {
    const res = await axios.get(`${this.#path}/majors`)
    return res.data;
  }
  
  // 회원 프로파일 조회
  async getMemberProfile(memberCode) {
    const res = await axios.get(`${this.#adminPath}/${memberCode}`)
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
