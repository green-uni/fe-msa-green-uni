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
  async logOut(){ return await axios.post(`${this.#path}/logout`) }

  async reissue(data) { return axios.post(`${this.#path}/reissue`, data)}
}

export default new AuthService();
