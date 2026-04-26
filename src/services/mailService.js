import axios from './httpRequester'

class MailService {
  #path = '/email'

  async sendCode(data) { return await axios.post(this.#path, data) }
  async checkCode(data) { return await axios.post(`${this.#path}/check`, data) }
}

export default new MailService();
