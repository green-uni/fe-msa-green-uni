import axios from './httpRequester'

const prof = '/core/professor/attendances'
const student = '/core/student/attendances'

class AttendanceService {

  // API-ATTD-01: 출석 QR 세션 생성
  async createSession(lectureId, classDate) {
    const res = await axios.post(`${prof}/${lectureId}/sessions`, { classDate })
    return res.data
  }

  // API-ATTD-02: 출석 세션 종료 (미스캔 학생 ABSENT 자동 처리)
  async endSession(lectureId, sessionId) {
    const res = await axios.patch(`${prof}/${lectureId}/sessions/${sessionId}`)
    return res.data
  }

  // API-ATTD-03: 학생 QR 스캔 출석 체크
  async checkInByQR(token) {
    const res = await axios.post(`${student}/scan`, { token })
    return res.data
  }

  // API-ATTD-04: 학생 본인 출석 조회 (lectureId 생략 시 전체 강의)
  async getMyAttendance(lectureId = null) {
    const params = lectureId ? { lectureId } : {}
    const res = await axios.get(`${student}/my`, { params })
    return res.data
  }

  // API-ATTD-05: 교수 출석 현황 조회 (attendDate 생략 시 전체)
  async getAttendanceList(lectureId, attendDate = null) {
    const params = attendDate ? { attendDate } : {}
    const res = await axios.get(`${prof}/${lectureId}`, { params })
    return res.data
  }

  // API-ATTD-06: 출석 현황 수정 (다중 학생 일괄)
  // updates: [{ attendId, status, reason? }, ...]
  async updateAttendance(lectureId, updates) {
    const res = await axios.patch(`${prof}/${lectureId}`, updates)
    return res.data
  }

  // API-ATTD-07: SSE QR 토큰 스트림 (5초마다 새 토큰 push)
  // 반환값인 EventSource 객체를 호출부에서 보관했다가 .close()로 종료
  openTokenStream(sessionId, onToken, onError) {
    const es = new EventSource(
      `/api/core/professor/attendances/sessions/${sessionId}/token`,
      { withCredentials: true }
    )
    es.onmessage = (e) => onToken(e.data)
    es.onerror   = (e) => onError(e)
    return es
  }

  // API-ATTD-08: 휴강 처리 (attendance_cancel 테이블 INSERT)
  async cancelClass(lectureId, classDate) {
    const res = await axios.post(`${prof}/${lectureId}/cancels`, { lectureId, classDate })
    return res.data
  }

  // API-ATTD-09: 보강 세션 생성
  // classDate: 보강 실시 날짜, originalDate: 대체하는 원래 휴강 날짜
  async createMakeupSession(lectureId, classDate, originalDate) {
    const res = await axios.post(`${prof}/${lectureId}/makeups`, {
      lectureId,
      classDate,
      originalDate,
    })
    return res.data
  }

  // API-ATTD-10: 휴강 목록 조회 (보강 모달용)
  // 응답: [{ cancelDate: "2026-04-21", makeupDate: null | "2026-05-10" }, ...]
  async getCancelledDates(lectureId) {
    const res = await axios.get(`${prof}/${lectureId}/cancels`)
    return res.data
  }
}

export default new AttendanceService()
