import axios from './httpRequester';

const path = 'core/admin/majors';  // api/core/admin/majors → 게이트웨이 → core-service의 /admin/majors

class MajorService {
  getMajorList()            { return axios.get(path) }
  getMajor(majorId)         { return axios.get(`${path}/${majorId}`) }
  createMajor(data)         { return axios.post(path, data) }
  editMajor(majorId, data)  { return axios.patch(`${path}/${majorId}`, data) }
  getCollegeList()          { return axios.get(`${path}/colleges`) }
  getProfessorList()        { return axios.get(`${path}/professors`) }
  getBuildingList() {
  return axios.get(`${path}/buildings`);
}
}

export default new MajorService();