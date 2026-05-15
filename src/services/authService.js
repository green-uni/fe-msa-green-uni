import axios from './httpRequester'

class AuthService {
  #path = '/auth'

  async logIn(form) { //로그인
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const res = await axios.post(`${this.#path}/login`, form,{
      headers: { 'X-Device-Id': isMobile ? 'mobile' : 'pc' }
    });
    return res.data;
  }
  async adminLogIn(form) {
    const res = await axios.post(`${this.#path}/admin/login`, form, {
      headers: { 'X-Device-Id': 'pc' }
    });
    return res.data;
  }

  async logOut(){ return await axios.post(`${this.#path}/logout`) }

  async reissue(d) { return axios.post(`${this.#path}/reissue`)}

  // 로그인 상태에서 비밀번호 변경
  async changePw(data){
    const res = await axios.patch(`${this.#path}/passwords`, data);
    return res.data;
  }

  // 최초 로그인 상태에서 비밀번호 변경
  async changeFirstPw(data){
    const res = await axios.patch(`${this.#path}/passwords/first`, data);
    return res.data;
  }
    
  // 이메일 인증 후 비밀번호 변경
  async resetPw(data){
    const res = await axios.patch(`${this.#path}/passwords/reset`, data);
    return res.data;
  }
}

export default new AuthService();
