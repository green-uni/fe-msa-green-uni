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

  // CAL-03 학사일정 활성화 상태 조회
  getActiveSchedules() {
  return axios.get('/academic/schedules/active')
  },

  // CAL-04 학사일정 수정 (관리자)
  updateSchedule(scheduleId, data) {
    return axios.patch(`/academic/admin/schedules/${scheduleId}`, data)
  },

  // CAL-05 학사일정 삭제 (관리자)
  deleteSchedule(scheduleId) {
    return axios.delete(`/academic/admin/schedules/${scheduleId}`)
  },

  // DASH 이번달 학사일정
  getMonthlySchedules() {
    const targetMonth = new Date().getMonth() + 1
    return axios.get('/academic/schedules', { params: { targetMonth } })
    },

  // DASH 배너용 진행중 학사일정
  getActiveBannerSchedule() {
    return axios.get('/academic/schedules/active/banner')
  },

  // DASH 배너 슬라이더용 진행중 학사일정 전체
  getActiveBannerSchedules() {
    return axios.get('/academic/schedules/active/banners')
  },
}

export default ScheduleService