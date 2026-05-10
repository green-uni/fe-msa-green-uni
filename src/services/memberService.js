import axios from './httpRequester'

class MemberService {
  #adminPath = '/member/admin'
  #path = '/member'

  async findProfile(){
    const res = await axios.get(`${this.#path}/my`)
    return res.data;
  };


  //////////// 계정 생성 //////////////
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
  // 관리자 상태 목록 조회
  async getAdminStatusList() {
    const res = await axios.get('/member/code?code_type=adminStatus')
    return res.data;
  }

}

export default new MemberService();
