import axios from './httpRequester'

const ScheduleService = {
  // CAL-02 학사일정 조회
  getSchedules(params) {
    return axios.get('/academic/schedules', { params })
  },

  // CAL-01 학사일정 등록 (관리자)
  createSchedule(data) {
    return axios.post('/academic/admin/schedules', data)
  },

  // CAL-04 학사일정 수정 (관리자)
  updateSchedule(scheduleId, data) {
    return axios.patch(`/academic/admin/schedules/${scheduleId}`, data)
  },

  // CAL-05 학사일정 삭제 (관리자)
  deleteSchedule(scheduleId) {
    return axios.delete(`/academic/admin/schedules/${scheduleId}`)
  },
}

export default ScheduleService