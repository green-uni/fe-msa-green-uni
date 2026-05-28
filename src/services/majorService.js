import axios from './httpRequester';

const path = 'core/admin/majors';

class MajorService {
  getMajorList()            { return axios.get(path) }
  getMajor(majorId)         { return axios.get(`${path}/${majorId}`) }
  createMajor(data)         { return axios.post(path, data) }
  editMajor(majorId, data)  { return axios.patch(`${path}/${majorId}`, data) }
  getCollegeList()          { return axios.get(`${path}/colleges`) }
  getProfessorList()        { return axios.get(`${path}/professors`) }
  getBuildingList()         { return axios.get(`${path}/buildings`); }

  /**
   * [추가] 학과 내 재학생(주전공/부전공) 존재 여부 확인
   * @param {Number} majorId 학과 ID
   */
  checkStudentsInMajor(majorId) {
    return axios.get(`${path}/${majorId}/students/check`);
  }
}

export default new MajorService();