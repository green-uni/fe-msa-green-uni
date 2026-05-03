import axios from './httpRequester'

class AuthService {
  #path = '/auth'

  async logIn(params) { //로그인
    const res = await axios.post(`${this.#path}/login`, params);
    return res.data;
  }
  async logOut(){ return await axios.post(`${this.#path}/logout`) }

  async reissue(data) { return axios.post(`${this.#path}/reissue`, data)}
}

export default new AuthService();
