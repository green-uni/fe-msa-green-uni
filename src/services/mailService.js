import axios from './httpRequester'

class MailService {
    #auth = '/auth'
    #path = '/emails'

    async sendCode(data) { return await axios.post(`${this.#auth}${this.#path}`, data) }
    async checkCode(data) { return await axios.post(`${this.#auth}${this.#path}/verification`, data) }
}

export default new MailService();
