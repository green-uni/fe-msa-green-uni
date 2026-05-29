import axios from './httpRequester'

const prof = '/core/professor/lectures'

class AttendLectureService {

  // API-LEC-06: 교수 본인 담당 강의 목록 조회
  // params: { year?, semester?, lectureName?, page?, size?, startIdx? }
  async getMyLectures(params = {}) {
    const res = await axios.get(`${prof}/my`, { params })
    return res.data
  }
}

export default new AttendLectureService()
