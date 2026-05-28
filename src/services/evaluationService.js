import axios from './httpRequester';

const professorPath = '/core/professor/evaluations';
const studentPath = '/core/student/evaluations';
const commonPath = '/core/evaluations';

class EvaluationService {
  // 교수 - 내 강의평가 목록
  async getProfessorEvalList(params = {}) {
    const res = await axios.get(`${professorPath}`, { params });
    return res.data;
  }

  // 교수 - 강의평가 상세
  async getProfessorEvalDetail(lectureId) {
    const res = await axios.get(`${professorPath}/${lectureId}`);
    return res.data;
  }

  // 학생 - 내 강의평가 목록
  async getStudentEvalList(params = {}) {
    const res = await axios.get(`${studentPath}`, { params });
    return res.data;
  }

  // 학생 - 강의평가 상세
  async getStudentEvalDetail(lectureId) {
    const res = await axios.get(`${studentPath}/${lectureId}`);
    return res.data;
  }

  // 학생 - 강의평가 등록
  async createEvaluation(lectureId, payload) {
    const res = await axios.post(`${studentPath}/${lectureId}`, payload);
    return res.data;
  }

  async getStudentEvalYears() {
  const res = await axios.get(`${studentPath}/years`);
  return res.data;
}

async getProfessorEvalYears() {
  const res = await axios.get(`${professorPath}/years`);
  return res.data;
}

}

export default new EvaluationService();