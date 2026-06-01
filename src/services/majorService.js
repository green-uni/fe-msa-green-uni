import axios from './httpRequester';

const path = 'core/admin/majors';

class MajorService {
  getMajorList({ status, search, page, size }) {
    return axios.get(path, { params: { status, search, page, size } })
  }
  getMajor(majorId)         { return axios.get(`${path}/${majorId}`) }
  createMajor(data)         { return axios.post(path, data) }
  editMajor(majorId, data)  { return axios.patch(`${path}/${majorId}`, data) }
  getCollegeList()          { return axios.get(`${path}/colleges`) }
  getProfessorList()        { return axios.get(`${path}/professors`) }
  getBuildingList()         { return axios.get(`${path}/buildings`) }

  checkStudentsInMajor(majorId) {
    return axios.get(`${path}/${majorId}/students/check`)
  }
}

export default new MajorService();