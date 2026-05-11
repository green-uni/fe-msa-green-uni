import axios from './httpRequester';

const professorPath = '/core/professor/lectures';
const adminPath = '/core/admin/lectures';
const commonPath = '/core/lectures';

class LectureService {

  // 건물 목록 조회
async getBuildings() {
  const res = await axios.get('/auth/code?code_type=building');
  return res.data.data;
}

  // 강의실 목록 조회
async getRoomNumber({ building }) {
  const res = await axios.get(`${professorPath}/classrooms`, { params: { building } });
  return res.data.data;
}

//전공조회
async getMajorList() {
  const res = await axios.get('/core/majors');
  return res.data;
}

  // 강의 개설 (교수)
  async postLecture(payload) {
    const res = await axios.post(`${professorPath}`, payload);
    return res.data;
  }

  // 내 강의 목록 조회 (교수)
  async getMyLecture() {
    const res = await axios.get(`${professorPath}/my`);
    return res.data;
  }

  // 강의 수정 (교수)
  async editLecture(payload) {
    const res = await axios.patch(`${professorPath}/${payload.lectureId}`, payload);
    return res.data;
  }

  // 강의 삭제 (교수)
  async deleteLecture(lectureId) {
    const res = await axios.delete(`${professorPath}/${lectureId}`);
    return res.data;
  }

  // 관리자 - 강의 목록 조회
  async getLectureList() {
    const res = await axios.get(`${adminPath}`);
    return res.data;
  }

  // 관리자 - 강의 승인/반려
  async updateLectureStatus(lectureId, status) {
    const res = await axios.patch(`${adminPath}/${lectureId}/status`, { status });
    return res.data;
  }

}

export default new LectureService();