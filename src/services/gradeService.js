import axios from './httpRequester';

// [추가] 성적 서비스 — 교수/학생 성적 관련 API 호출
class GradeService {
    #professorPath = '/core/professor/grades';
    #studentPath   = '/core/student/grades';

    // 교수 담당 강의 목록 (성적 관리 강의 선택 화면용)
    async getProfessorLectures() {
        const res = await axios.get(`${this.#professorPath}/lectures`);
        return res.data.data;
    }

    // API-GPA-03: 교수 성적 조회
    async getGradeList(lectureId) {
        const res = await axios.get(`${this.#professorPath}/${lectureId}`);
        return res.data.data;
    }

    // API-GPA-02: 교수 성적 입력/수정
    async updateGrades(lectureId, reqList) {
        const res = await axios.patch(`${this.#professorPath}/${lectureId}`, reqList);
        return res.data;
    }

    // API-GPA-05: 학생 본인 성적 조회
    async getStudentGrades(year = null, semester = null) {
        const params = {}
        if (year !== null)     params.year     = year
        if (semester !== null) params.semester = semester
        const res = await axios.get(`${this.#studentPath}/my`, { params })
        return res.data.data
    }

    // API-GPA-06: 학생 전체 성적 상세조회
    async getStudentGradeAll() {
        const res = await axios.get(`${this.#studentPath}/my/detail`)
        return res.data.data
    }

    // 학생 이의신청 내역 조회
    async getStudentAppealList() {
        const res = await axios.get(`${this.#studentPath}/appeals/my`)
        return res.data.data
    }

    // API-GPA-07: 이의신청 폼 사전 조회
    async getAppealInfo(gradeId) {
        const res = await axios.get(`${this.#studentPath}/${gradeId}/appeal`)
        return res.data.data
    }

    // API-GPA-07: 이의신청 제출
    async submitAppeal(gradeId, reason) {
        const res = await axios.post(`${this.#studentPath}/${gradeId}/appeal`, { reason })
        return res.data
    }

    // 교수 이의신청 목록 조회
    async getProfessorAppealList({ page = 1, size = 10 } = {}) {
        const res = await axios.get(`${this.#professorPath}/appeals`, { params: { page, size } })
        return res.data.data
    }

    // 교수 이의신청 상세 조회
    async getProfessorAppealDetail(courseId) {
        const res = await axios.get(`${this.#professorPath}/appeals/${courseId}`)
        return res.data.data
    }

    // 교수 이의신청 처리 (승인/반려)
    async processAppeal(courseId, req) {
        const res = await axios.patch(`${this.#professorPath}/appeals/${courseId}`, req)
        return res.data
    }
}

export default new GradeService();