import axios from './httpRequester'

class MemberService {
  #adminPath = '/member/admin'
  #path = '/member'

  async findProfile(){
    const res = await axios.get(`${this.#path}/my`)
    return res.data;
  };


  //////////// 계정 생성 //////////////
  // 역할 조회
  async getMemberRole() {
    const res = await axios.get('/auth/code?code_type=memberRole')
    return res.data;
  }

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

  // 학생 상태 목록 조회
  async getStudentStatusList() {
    const res = await axios.get('/auth/code?code_type=studentStatus')
    return res.data;
  }
  // 교수 상태 목록 조회
  async getProfessorStatusList() {
    const res = await axios.get('/auth/code?code_type=professorStatus')
    return res.data;
  }
  async getProfessorPositionList() {
    const res = await axios.get('/member/code?code_type=professorPosition')
    return res.data;
  }
  async getProfessorDegreeList() {
    const res = await axios.get('/member/code?code_type=professorDegree')
    return res.data;
  }
  async getBuildingList() {
    const res = await axios.get('/auth/code?code_type=building')
    return res.data;
  }
  // 관리자 상태 목록 조회
  async getAdminStatusList() {
    const res = await axios.get('/member/code?code_type=adminStatus')
    return res.data;
  }

}

export default new MemberService();
