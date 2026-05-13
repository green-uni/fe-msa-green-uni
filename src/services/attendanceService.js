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

  // 출석 기록이 있는 날짜 목록 조회 (달력 연두색 하이라이트용)
  // 응답: ["2026-04-01", "2026-04-08", ...] 형태의 YYYY-MM-DD 배열
  async getRecordedDates(lectureId) {
    const res = await axios.get(`${prof}/${lectureId}/dates`)
    return res.data
  }

  // API-ATTD-05: 출석 목록 조회 (강의 + 날짜)
  // attendDate 생략 시 오늘 날짜로 조회
  async getAttendanceList(lectureId, attendDate = null) {
    const params = attendDate ? { attendDate } : {}
    const res = await axios.get(`${prof}/${lectureId}`, { params })
    return res.data
  }

  // API-ATTD-06: 출석 상태 일괄 수정
  // updates: [{ attendId, status, reason }, ...]
  async updateAttendStatuses(lectureId, updates) {
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
    // EventSource는 오류 발생 시 자동 재연결을 시도하므로 명시적으로 닫아야 함
    // 세션 종료(410 GONE) 또는 연결 오류 시 재연결 없이 스트림 정리
    es.onerror = (e) => { es.close(); onError(e) }
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

  // 오늘 세션 상태 조회 — 버튼 상태 결정용
  // 응답: null(세션 없음) | { sessionId, classDate, isActive: true(진행중) | false(완료) }
  async getTodaySession(lectureId) {
    const res = await axios.get(`${prof}/${lectureId}/sessions/today`)
    return res.data
  }
}

export default new AttendanceService()
