import axios from './httpRequester'

const prof = '/core/professor/attendances'
const student = '/core/student/attendances'

class AttendanceService {
    // ── 교수 강의 목록/단건 조회 (QR 출석 강의 선택 화면용) ────────────────────────

    // 교수 본인이 담당하는 승인된 강의 목록
    async getProfessorLectures() {
        const res = await axios.get(`${prof}/my-lectures`)
        return res.data
    }
    
    // 특정 강의 정보 (QR 출석 페이지 헤더에서 강의명·강의실 표시용)
    async getProfessorLecture(lectureId) {
        const res = await axios.get(`${prof}/my-lectures/${lectureId}`)
        return res.data
    }
    
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

  // 강의의 출석 세션 목록 조회 (날짜 최신순)
  async getSessionList(lectureId) {
    const res = await axios.get(`${prof}/${lectureId}/sessions`)
    return res.data
  }

  // 특정 세션의 출석부 조회 (수강생 전체 + 출석 현황)
  async getRoster(lectureId, sessionId) {
    const res = await axios.get(`${prof}/${lectureId}/sessions/${sessionId}/roster`)
    return res.data
  }

  // 출석 상태 단건 수정
  async updateAttendStatus(lectureId, attendId, status, reason = null) {
    const res = await axios.patch(`${prof}/${lectureId}/attendances/${attendId}`, { status, reason })
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

  // 활성 세션 조회 (페이지 재진입 시 기존 세션 복구용)
  // 응답: { sessionId, classDate } 또는 data: null (활성 세션 없음)
  async getActiveSession(lectureId) {
    const res = await axios.get(`${prof}/${lectureId}/sessions/active`)
    return res.data
  }
}

export default new AttendanceService()
