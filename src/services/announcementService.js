import axios from './httpRequester'

class AnnouncementService {
    #path       = '/academic/announcements'
    #adminPath  = '/academic/admin/announcements'
    #publicPath = '/academic/public/announcements'

    // 공지사항이 존재하는 연도 목록 (로그인 사용자)
    async getYears() {
        const res = await axios.get(`${this.#path}/years`)
        return res.data.data
    }

    // 공지사항이 존재하는 연도 목록 (비로그인)
    async getPublicYears() {
        const res = await axios.get(`${this.#publicPath}/years`)
        return res.data.data
    }

    // 목록 조회 (학생/교수/관리자 - 역할별 자동 필터)
    async getList({ page = 1, size = 10, targetRole = null, search = null, year = null } = {}) {
        const params = { page, size }
        if (targetRole) params.targetRole = targetRole
        if (search)     params.search     = search
        if (year)       params.year       = year
        const res = await axios.get(this.#path, { params })
        return res.data.data
    }

    // 상세 조회 (학생/교수)
    async getDetail(annoId) {
        const res = await axios.get(`${this.#path}/${annoId}`)
        return res.data.data
    }

    // 상세 조회 (관리자)
    async getAdminDetail(annoId) {
        const res = await axios.get(`${this.#adminPath}/${annoId}`)
        return res.data.data
    }

    // 등록 (관리자)
    async create(req) {
        const res = await axios.post(this.#adminPath, req)
        return res.data.data
    }

    // 수정 (관리자)
    async update(annoId, req) {
        const res = await axios.put(`${this.#adminPath}/${annoId}`, req)
        return res.data
    }

    // 삭제 (관리자)
    async remove(annoId) {
        const res = await axios.delete(`${this.#adminPath}/${annoId}`)
        return res.data
    }

    // 공개 목록 (비로그인 - 로그인 화면 대시보드용)
    async getPublicList({ page = 1, size = 5, search = null, year = null } = {}) {
        const params = { page, size }
        if (search) params.search = search
        if (year)   params.year   = year
        const res = await axios.get(this.#publicPath, { params })
        return res.data.data
    }

    // 공개 상세 (비로그인)
    async getPublicDetail(annoId) {
        const res = await axios.get(`${this.#publicPath}/${annoId}`)
        return res.data.data
    }
}

export default new AnnouncementService()