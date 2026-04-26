import axios from './httpRequester'

class MemberService {
  #adminPath = '/admin/members'
  #path = '/member'

  async logIn(params) {
    const res = await axios.post(`${this.#path}/login`, params);
    return res.data;
  }
  async logOut(){ return await axios.post(`${this.#path}/logout`) }

  async reissue(data) { return axios.post(`${this.#path}/reissue`, data)}

  // 계정 생성
  async createMember(data) {
    const res =  await axios.post(this.#adminPath, data)
    return res.data;
  }

  // 계정 목록 불러오기
  async findAllMember(params) {
    const res =  await axios.get(this.#adminPath, { params })
    return res.data;
  }
  // 계정 상태 수정
  async modStatusList(jsonBody) {
    const res =  await axios.put(`${this.#adminPath}/mod`, jsonBody)
    return res.data;
  }
  // 계정 목록 최대 페이지 가져오기
  async getMemberMaxPage(params){
    const res =  await axios.get(`${this.#adminPath}/max_page`, { params });
    return res.data;
  }

  // 로그인 유저 프로파일 찾기
  async findUserProfile(){
    const res = await axios.get(`${this.#path}/me`)
    return res.data;
  };
  // 로그인 유저 프로파일 수정
  async modifyUserProfile(data){
    const res = await axios.put(`${this.#path}/me/mod`, data)
    return res.data;
  }

  // 로그인 상태에서 비밀번호 변경
  async changePw(data){
    const res = await axios.patch(`${this.#path}/me/pw`, data);
    return res.data;}
    
  // 이메일 인증 후 비밀번호 변경
  async resetPw(data){
    const res = await axios.patch(`${this.#path}/pw`, data);
    return res.data;}
}

export default new MemberService();
