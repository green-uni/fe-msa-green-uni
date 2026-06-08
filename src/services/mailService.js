import axios from './httpRequester'

class MailService {
    #auth = '/auth'
    #path = '/emails'

    async sendCode(data) {
        const res = await axios.post(`${this.#auth}${this.#path}`, data, { _skipErrorPage: true });
        return res.data;
    }
    async checkCode(data) {
        const res = await axios.post(`${this.#auth}${this.#path}/verification`, data, { _skipErrorPage: true })
        return res.data;
    }
}

export default new MailService();
