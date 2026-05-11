import axios from './httpRequester';

class LectureService {
  #professorPath = '/core/professor/lectures';
  #adminPath = '/core/admin/lectures';
  #studentPath = '/core/student/lectures';
  #commonPath = '/core/lectures';

  // 건물 목록 조회
  async getBuildings() {
    const res = await axios.get('/auth/code?code_type=building');
    return res.data.data;
  }

  // 강의실 목록 조회
  async getRoomNumber({ building }) {
    const res = await axios.get(`${this.#professorPath}/classrooms`, { params: { building } });
    return res.data.data;
  }

  // 전공 목록 조회
  async getMajorList() {
    const res = await axios.get('/core/majors');
    return res.data;
  }

  // ── 교수 ──────────────────────────────────────
  async postLecture(payload) {
    const res = await axios.post(`${this.#professorPath}`, payload);
    return res.data;
  }

  async getProfessorMyLectures(params = {}) {
    const res = await axios.get(`${this.#professorPath}/my`, { params });
    return res.data;
  }

  async editLecture(lectureId, payload) {
    const res = await axios.patch(`${this.#professorPath}/${lectureId}`, payload);
    return res.data;
  }

  async deleteLecture(lectureId) {
    const res = await axios.delete(`${this.#professorPath}/${lectureId}`);
    return res.data;
  }

  // ── 학생 ──────────────────────────────────────
  async getStudentMyLectures(params = {}) {
    const res = await axios.get(`${this.#studentPath}/my`, { params });
    return res.data;
  }

  // ── 관리자 ────────────────────────────────────
  async getAdminLectures(params = {}) {
    const res = await axios.get(`${this.#adminPath}/my`, { params });
    return res.data;
  }

  async updateLectureStatus(lectureId, payload) {
    const res = await axios.patch(`${this.#adminPath}/${lectureId}/approvals`, payload);
    return res.data;
  }

  // ── 공통 ──────────────────────────────────────
  async getAllLectures(params = {}) {
    const res = await axios.get(`${this.#commonPath}`, { params });
    return res.data;
  }

  async getLectureDetail(lectureId) {
    const res = await axios.get(`${this.#commonPath}/${lectureId}`);
    return res.data;
  }
}

export default new LectureService();