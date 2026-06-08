<template>
  <div style="position: relative">

    <!-- 강의 정보 -->
    <section class="card">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-key">강의명</span>
          <span class="info-val">{{ lecture.lectureName || '정보 로딩 중...' }}</span>
        </div>
        <div class="info-item">
          <span class="info-key">강의실</span>
          <span class="info-val pre-line">{{ scheduleRoomText(lecture.schedules) }}</span>
        </div>
      </div>
    </section>

    <!-- 대기 상태 -->
    <template v-if="!isSessionActive && !isSessionEnded && !isClassCancelled">
      <p class="card tac">
        {{ isTodayCompleted ? '오늘 출석이 이미 완료되었습니다.' : '출석 시작 버튼을 누르면 QR이 활성화됩니다.' }}
      </p>
      <div class="page-footer">
        <button class="btn btn-default" @click="goToLectureList"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
        <div class="action-group">
          <template v-if="isTodayCompleted">
            <button class="btn btn-default" disabled>출석완료</button>
            <button class="btn btn-submit" @click="goToList">출석 현황 보기</button>
          </template>
          <template v-else>
            <button class="btn btn-default" @click="handleCancelClass" :disabled="isLoading">휴강처리</button>
            <button class="btn btn-line point" @click="handleOpenMakeupModal" :disabled="isLoading">보강 QR 생성</button>
            <button class="btn btn-submit" @click="handleStartSession" :disabled="isLoading">
              {{ isLoading ? '세션 생성 중...' : '출석 시작' }}
            </button>
          </template>
        </div>
      </div>
    </template>

    <!-- 출석 진행 중 -->
    <template v-if="isSessionActive">
      <div v-if="isMakeupSession" class="makeup-badge">
        보강 수업 — 원래 수업일: {{ makeupOriginalDateFormatted }}
      </div>

      <div class="qr-wrapper">
        <p class="empty-text" style="padding: 0">학생들이 아래 QR을 스캔하도록 안내해주세요.</p>
        <qrcode-vue v-if="currentToken" :value="currentToken" :size="280" level="H" class="qr-image" />
        <div v-else class="qr-loading">QR 생성 중...</div>
        <div class="countdown-bar-wrap">
          <div class="countdown-bar" :style="{ width: countdownWidth + '%' }"></div>
        </div>
        <p class="empty-text" style="padding: 0;">{{ countdown }}초 후 QR이 자동으로 갱신됩니다</p>
      </div>
      <div class="page-footer">
        <button class="btn btn-default" @click="goToLectureList"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
        <p class="notice-caution" style="text-align: center">종료 시 미스캔 학생은 자동으로 결석 처리됩니다.</p>
        <button class="btn btn-submit" @click="handleEndSession" :disabled="isLoading">
          {{ isLoading ? '처리 중...' : '출석 종료' }}
        </button>
      </div>
    </template>

    <!-- 출석 종료 완료 -->
    <template v-if="isSessionEnded">
      <div class="result-section">
        <p class="status-title success">
          <font-awesome-icon icon="fa-solid fa-circle-check" /> 출석이 마감되었습니다
        </p>
        <p>종료 시각: <strong>{{ endedAtFormatted }}</strong></p>
        <p class="empty-text" style="padding: 0">미스캔 학생은 결석 처리되었습니다. 수동 수정이 필요한 경우 출석 페이지를 이용해주세요.</p>
      </div>
      <div class="page-footer">
        <button class="btn btn-default" @click="goToLectureList"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
        <button class="btn btn-submit" @click="goToList">출석 현황</button>
      </div>
    </template>

    <!-- 휴강 처리 완료 -->
    <template v-if="isClassCancelled">
      <div class="card tac">
        <p class="status-title">오늘 수업이 휴강 처리되었습니다</p>
        <p class="empty-text" style="padding: 0">수강 학생 전원의 출석 상태가 휴강으로 등록됩니다.</p>
      </div>
        <div class="page-footer">
          <button class="btn btn-default" @click="goToLectureList"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
          <button class="btn btn-submit" @click="goToList">출석 현황 보기</button>
        </div>
    </template>

    <!-- 보강 날짜 선택 모달 -->
    <div v-if="showMakeupModal" class="modal-backdrop" @click.self="showMakeupModal = false">
      <div class="modal-box">
        <p class="card-label">보강할 휴강 날짜 선택</p>
        <ul class="cancel-date-list">
          <li
            v-for="item in cancelledDates"
            :key="item.cancelDate"
            class="cancel-date-item"
            :class="{ selected: selectedCancelDate === item.cancelDate }"
            @click="selectedCancelDate = item.cancelDate">
            <span style="font-weight: 600">{{ formatCancelDate(item.cancelDate) }}</span>
            <span class="badge-pending">보강 미완료</span>
          </li>
        </ul>
        <div class="action-buttons">
          <button class="btn btn-default" @click="showMakeupModal = false">취소</button>
          <button class="btn btn-submit" :disabled="!selectedCancelDate || isLoading" @click="handleStartMakeupSession">
            {{ isLoading ? '생성 중...' : '보강 QR 시작' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useRoute, useRouter } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'
import { useModalStore } from '@/stores/modal.js'

const route = useRoute()
const router = useRouter()
const modal = useModalStore()
const lectureId = route.params.lectureId

// ── 상태값 ──────────────────────────────────────────────────────
const lecture = ref({ lectureName: '', schedules: [] })

const sessionId          = ref(null)
const currentToken       = ref('')
const isSessionActive    = ref(false)
const isSessionEnded     = ref(false)
const isClassCancelled   = ref(false)
const isTodayCompleted   = ref(false) // 페이지 진입 시 이미 종료된 세션이 있을 때

const isMakeupSession    = ref(false)
const makeupOriginalDate = ref('')

const endedAt   = ref('')
const isLoading = ref(false)
const countdown = ref(5)

// 보강 모달
const showMakeupModal    = ref(false)
const cancelledDates     = ref([])
const selectedCancelDate = ref('')

// ── 강의실 표시 헬퍼 (template에서 사용) ──────────────────────────
const scheduleRoomText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join('\n')
}

// ── computed ────────────────────────────────────────────────────
// toISOString()은 UTC 기준이라 KST 새벽 0~9시에는 날짜가 1일 어긋남 → 로컬 날짜 사용
const today = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
)

// 백엔드 LocalDateTime 문자열을 안전하게 파싱
// "2026-05-07T10:30:00" 또는 "2026-05-07 10:30:00" 두 형식 모두 처리
const endedAtFormatted = computed(() => {
  if (!endedAt.value) return ''
  const normalized = String(endedAt.value).replace(' ', 'T')
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return endedAt.value
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
})

const countdownWidth = computed(() => (countdown.value / 5) * 100)

const makeupOriginalDateFormatted = computed(() => {
  if (!makeupOriginalDate.value) return ''
  const normalized = String(makeupOriginalDate.value).replace(' ', 'T')
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return makeupOriginalDate.value
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

// ── 페이지 진입 시 강의 정보 로드 + 오늘 세션 상태 복구 ─────────
onMounted(async () => {
  // 1. 강의명·강의실 표시
  try {
    const res = await attendanceService.getProfessorLecture(lectureId)
    const data = res.data ?? res
    lecture.value = {
      lectureName: data.lectureName,
      schedules: data.schedules ?? [],
    }
  } catch { /* 세션 시작 후 서버 응답으로 채워짐 */ }

  // 2. 오늘 세션 상태 확인
  //    - data: null  → 세션 없음, 출석시작 버튼 활성화
  //    - isActive: true  → 진행 중, QR 화면 복구
  //    - isActive: false → 완료됨, 출석완료 버튼(비활성)으로 전환
  try {
    const res = await attendanceService.getTodaySession(lectureId)
    const session = res.data
    if (session?.sessionId) {
      if (session.isActive) {
        sessionId.value       = session.sessionId
        isSessionActive.value = true
        startStream(session.sessionId)
      } else if (session.sessionType === 'CANCEL') {
        isClassCancelled.value = true
      } else {
        isTodayCompleted.value = true
      }
    }
  } catch { /* 오늘 세션 없음 */ }
})

// ── 내부 변수 ────────────────────────────────────────────────────
let eventSourceRef  = null
let countTimerRef   = null
let reconnectTimer  = null  // [추가] SSE 재연결 타이머
let reconnectCount  = 0     // [추가] 연속 재연결 시도 횟수
const MAX_RECONNECT = 5     // [추가] 이 횟수 초과 시에만 세션 종료로 처리

// ── QR 코드에 담길 URL 생성 ──────────────────────────────────────
// 일반 카메라/QR 스캐너로 찍으면 브라우저가 이 URL을 열어 로그인 후 자동 출석 처리
// VITE_SCAN_BASE_URL: 교수가 localhost로 접속해도 QR에는 모바일이 접근 가능한 네트워크 IP를 사용
// 미설정 시 window.location.origin으로 fallback (운영 서버에서는 동일 도메인이므로 정상 동작)
// [수정] ngrok 도메인인 경우 ngrok-skip-browser-warning 파라미터 추가
//        — QR 스캔 시 ngrok 인터스티셜(경고 화면) 건너뛰기, 미설정 시 빈 문자열
function buildScanUrl(token) {
  const base = import.meta.env.VITE_SCAN_BASE_URL || window.location.origin
  const skipParam = base.includes('ngrok') ? '&ngrok-skip-browser-warning=true' : ''
  return `${base}/student/attendances/scan?token=${token}${skipParam}`
}

// ── 공통: SSE + 카운트다운 시작 ─────────────────────────────────
function startStream(sid) {
  eventSourceRef = attendanceService.openTokenStream(
    sid,
    (token) => {
      currentToken.value = buildScanUrl(token)
      countdown.value    = 5
      reconnectCount     = 0  // [추가] 토큰 수신 성공 시 재연결 카운터 초기화
    },
    // [수정] SSE 오류 → 즉시 종료 대신 재연결 시도
    // 단순 네트워크 끊김(게이트웨이 타임아웃 등)과 실제 세션 종료를 구분
    (err) => {
      console.warn('SSE 연결 끊김, 재연결 시도:', reconnectCount + 1, '/', MAX_RECONNECT, err)
      stopStream()

      if (reconnectCount < MAX_RECONNECT && isSessionActive.value) {
        reconnectCount++
        // 3초 후 재연결 — 세션이 아직 활성 상태면 SSE 스트림 재시작
        reconnectTimer = setTimeout(() => startStream(sid), 3_000)
      } else {
        // MAX_RECONNECT 초과 → 세션이 실제로 종료된 것으로 판단
        isSessionActive.value = false
        isSessionEnded.value  = true
      }
    },
  )
  countTimerRef = setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1
  }, 1000)
}

// ── 공통: SSE + 카운트다운 정리 ─────────────────────────────────
function stopStream() {
  if (reconnectTimer)  { clearTimeout(reconnectTimer); reconnectTimer = null }  // [추가]
  if (eventSourceRef)  { eventSourceRef.close(); eventSourceRef = null }
  clearInterval(countTimerRef); countTimerRef = null
}

// ── 출석 시작 ────────────────────────────────────────────────────
async function handleStartSession() {
  // 오늘 요일(한글)이 이 강의의 스케줄 요일 중 하나인지 확인
  // new Date().getDay(): 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const todayKor = days[new Date().getDay()]
  const hasTodaySchedule = lecture.value.schedules?.some(sch => sch.dayOfWeek === todayKor)
  if (!hasTodaySchedule) {
    await modal.showAlert('오늘은 수업일자가 아닙니다.', 'warning')
    return
  }

  isLoading.value = true
  try {
    const res = await attendanceService.createSession(lectureId, today.value)
    const data = res.data
    sessionId.value = data.sessionId
    // 세션 시작 응답에는 schedules가 없으므로 기존 데이터를 유지하고 강의명만 갱신
    lecture.value   = { ...lecture.value, lectureName: data.lectureName }
    isSessionActive.value = true
    startStream(data.sessionId)
  } catch {
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 출석 종료 ────────────────────────────────────────────────────
async function handleEndSession() {
  const confirmed = await modal.showConfirm(
    '출석을 종료하시겠습니까?\n아직 스캔하지 않은 학생은 자동으로 결석 처리됩니다.',
    'warning',
  )
  if (!confirmed) return

  isLoading.value = true
  try {
    const res = await attendanceService.endSession(lectureId, sessionId.value)
    const data = res.data
    endedAt.value = data.endedAt
    stopStream()
    isSessionActive.value = false
    isSessionEnded.value  = true
    isMakeupSession.value = false

    await modal.showAlert(
      `출석이 정상적으로 종료되었습니다.\n종료 시각: ${endedAtFormatted.value}`,
      'success',
    )
  } catch {
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 휴강 처리 ────────────────────────────────────────────────────
async function handleCancelClass() {
  // [추가] 출석 시작과 동일하게 오늘이 수업 요일인지 먼저 검증
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const todayKor = days[new Date().getDay()]
  const hasTodaySchedule = lecture.value.schedules?.some(sch => sch.dayOfWeek === todayKor)
  if (!hasTodaySchedule) {
    await modal.showAlert('오늘은 수업일자가 아닙니다.', 'warning')
    return
  }

  const confirmed = await modal.showConfirm(
    `오늘(${today.value}) 수업을 휴강 처리하시겠습니까?\n수강 학생 전원이 휴강으로 등록됩니다.`,
    'warning',
  )
  if (!confirmed) return

  isLoading.value = true
  try {
    await attendanceService.cancelClass(lectureId, today.value)
    isClassCancelled.value = true
    await modal.showAlert('오늘 수업이 휴강 처리되었습니다.', 'success')
  } catch {
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 보강 모달 열기 ────────────────────────────────────────────────
async function handleOpenMakeupModal() {
  isLoading.value = true
  try {
    const res = await attendanceService.getCancelledDates(lectureId)
    const list = res.data ?? res
    // makeupDate가 null인 날짜만 선택 가능
    cancelledDates.value     = list.filter(item => !item.makeupDate)
    selectedCancelDate.value = ''

    if (cancelledDates.value.length === 0) {
      await modal.showAlert('보강 가능한 휴강 날짜가 없습니다.', 'info')
      return
    }
    showMakeupModal.value = true
  } catch {
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 보강 세션 시작 ────────────────────────────────────────────────
async function handleStartMakeupSession() {
  if (!selectedCancelDate.value) return

  isLoading.value = true
  try {
    // [수정] 백엔드 LocalDate 파싱을 위해 'T00:00:00' 접미어 제거
    const res = await attendanceService.createMakeupSession(
      lectureId,
      today.value,
      selectedCancelDate.value,
    )
    const data = res.data
    sessionId.value          = data.sessionId
    makeupOriginalDate.value = data.originalDate ?? selectedCancelDate.value
    // 보강 세션 응답에도 schedules가 없으므로 기존 데이터를 유지하고 강의명만 갱신
    lecture.value            = { ...lecture.value, lectureName: data.lectureName }
    isMakeupSession.value    = true
    isSessionActive.value    = true
    showMakeupModal.value    = false
    startStream(data.sessionId)
  } catch {
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 화면 이동 ────────────────────────────────────────────────────
function goToLectureList() {
  router.push('/attendances/professor')
}

function goToList() {
  router.push(`/attendances/${lectureId}/roster`)
}

// ── 날짜 포맷 유틸 ───────────────────────────────────────────────
function formatCancelDate(dateStr) {
  const normalized = String(dateStr).replace(' ', 'T')
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

// ── 컴포넌트 언마운트 시 정리 ────────────────────────────────────
onUnmounted(() => stopStream())
</script>

<style scoped lang="scss">
.info-grid{grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));}
/* 출석 완료 결과 */
.result-section { background: $green-50; border: 1px solid $green-300; border-radius: $radius-sm; padding: 24px; text-align: center; display: flex; flex-direction: column; gap: 8px; }

/* 보강 안내 배지 */
.makeup-badge {  background: $warning-bg;  border: 1px solid $warning; border-radius: $radius-xs; padding: 8px 16px; font-weight: 600; color: $warning; width: 100%; text-align: center; margin-bottom: $sm;}

/* QR 영역 */
.qr-wrapper { display: flex; flex-direction: column; align-items: center; gap: 12px; background: #fff;  border: 1px solid $border-color; border-radius: 8px; padding: 24px; width: 100%;}
.qr-image   { border-radius: 8px; overflow: hidden;}
.qr-loading {  width: 280px; height: 280px; display: flex; align-items: center; justify-content: center; background: #f4f6ff; border-radius: 8px; font-size: $fs-xs; color: $font-color-light;}
.countdown-bar-wrap {
  width: 280px; height: 6px; background: $border-color; border-radius: 3px; overflow: hidden;
  .countdown-bar { height: 100%; background: $green-600; border-radius: 3px; transition: width 0.9s linear;}
}

/* 보강 날짜 모달 */
.modal-backdrop {  position: fixed; inset: 0;  background: rgba(0,0,0,0.45);  display: flex; align-items: center; justify-content: center;  z-index: 1000;}
.modal-box {  background: #fff; border-radius: 16px;  padding: 28px 24px; width: 340px; max-width: 90vw;  display: flex; flex-direction: column; gap: 16px;}
.cancel-date-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.cancel-date-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border: 1px solid $border-color;
  border-radius: 10px; cursor: pointer; transition: border-color 0.15s;
  &:hover   { border-color: $green-600; }
  &.selected { border-color: $green-600; background: rgba($green-600, 0.06); }
}
</style>
