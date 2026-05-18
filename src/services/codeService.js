import axios from './httpRequester'

class codeListService {
  #memberPath = '/member/code?code_type='
  #corePath = '/core/code?code_type='
  #path = '/auth/code?code_type='

  // 역할 조회
  async getMemberRole() {
    const res = await axios.get(`${this.#path}memberRole`)
    return res.data;
  }
  // 학생 상태 목록 조회
  async getStudentStatusList() {
    const res = await axios.get(`${this.#path}studentStatus`)
    return res.data;
  }
  // 교수 상태 목록 조회
  async getProfessorStatusList() {
    const res = await axios.get(`${this.#path}professorStatus`)
    return res.data;
  }
  // 교수 직위 목록 조회
  async getProfessorPositionList() {
    const res = await axios.get(`${this.#memberPath}professorPosition`)
    return res.data;
    }
    // 교수 학위 목록 조회
  async getProfessorDegreeList() {
    const res = await axios.get(`${this.#path}professorDegree`)
    return res.data;
  }
  // 관리자 상태 목록 조회
  async getAdminStatusList() {
    const res = await axios.get(`${this.#memberPath}adminStatus`)
    return res.data;
    }
    // 건물 목록 조회
  async getBuildingList() {
    const res = await axios.get(`${this.#path}building`)
    return res.data;
  }


}

export default new codeListService();
