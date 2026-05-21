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
}

export default new GradeService();