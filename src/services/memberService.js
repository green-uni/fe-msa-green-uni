import axios from './httpRequester'

class MemberService {
  #adminPath = '/member/admin'
  #path = '/member'

  async findProfile(){
    const res = await axios.get(`${this.#path}/my`)
    return res.data;
  };

}

export default new MemberService();
