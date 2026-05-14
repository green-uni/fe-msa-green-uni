import axios from './httpRequester'

class MailService {
    #auth = '/auth'
    #path = '/emails'

    async sendCode(data) { 
        const res = await axios.post(`${this.#auth}${this.#path}`, data);
        return res.data;
    }
    async checkCode(data) { 
        const res = await axios.post(`${this.#auth}${this.#path}/verification`, data) 
        return res.data;
    }
}

export default new MailService();
