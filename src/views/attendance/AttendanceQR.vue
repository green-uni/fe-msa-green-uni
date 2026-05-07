<template>
  <div class="attendance-qr-page">

    <!-- 강의 정보 헤더 -->
    <div class="lecture-info-card">
      <div class="lecture-info-row">
        <span class="info-label">강의명</span>
        <span class="info-value">{{ lecture.lectureName || '정보 로딩 중...' }}</span>
      </div>
      <div class="lecture-info-row">
        <span class="info-label">강의실</span>
        <span class="info-value">{{ lecture.lectureRoom || '-' }}</span>
      </div>
      <div class="lecture-info-row">
        <span class="info-label">수업일</span>
        <span class="info-value">{{ todayFormatted }}</span>
      </div>
    </div>

    <!-- 대기 상태: 출석 시작 버튼만 표시 -->
    <div v-if="!isSessionActive && !isSessionEnded" class="standby-section">
      <p class="standby-text">출석 시작 버튼을 누르면 QR이 활성화됩니다.</p>
      <button class="btn btn-start" @click="handleStartSession" :disabled="isLoading">
        {{ isLoading ? '세션 생성 중...' : '출석 시작' }}
      </button>
    </div>

    <!-- 출석 진행 중 -->
    <div v-if="isSessionActive" class="active-section">
      <div v-if="isMakeupSession" class="makeup-badge">
        보강 수업 — 원래 수업일: {{ makeupOriginalDateFormatted }}
      </div>

      <div class="qr-wrapper">
        <p class="qr-guide">학생들이 아래 QR을 스캔하도록 안내해주세요.</p>
        <qrcode-vue
          v-if="currentToken"
          :value="currentToken"
          :size="280"
          level="H"
          class="qr-image"
        />
        <div v-else class="qr-loading">QR 생성 중...</div>
        <div class="countdown-bar-wrap">
          <div class="countdown-bar" :style="{ width: countdownWidth + '%' }"></div>
        </div>
        <p class="countdown-text">{{ countdown }}초 후 QR이 자동으로 갱신됩니다</p>
      </div>

      <div class="end-section">
        <p class="end-warning">⚠️ 종료 시 미스캔 학생은 자동으로 결석 처리됩니다.</p>
        <button class="btn btn-end" @click="handleEndSession" :disabled="isLoading">
          {{ isLoading ? '처리 중...' : '출석 종료' }}
        </button>
      </div>
    </div>

    <!-- 출석 종료 완료 -->
    <div v-if="isSessionEnded" class="result-section">
      <h3 class="result-title">✅ 출석이 마감되었습니다</h3>
      <p class="result-text">종료 시각: <strong>{{ endedAtFormatted }}</strong></p>
      <p class="result-sub">
        미스캔 학생은 결석 처리되었습니다. 수동 수정이 필요한 경우 출석 현황 수정 화면을 이용해주세요.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useRoute } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'
import { useModalStore } from '@/stores/modal.js'

const route = useRoute()
const modal = useModalStore()
const lectureId = route.params.lectureId

// ── 보강 모드 감지 (AttendanceLectureList에서 쿼리로 전달) ────────
const isMakeupMode    = route.query.mode === 'makeup'
const makeupQueryDate = route.query.originalDate ?? ''  // "2026-04-21"

// ── 상태값 ──────────────────────────────────────────────────────
const lecture = ref({ lectureName: '', lectureRoom: '' })

const sessionId       = ref(null)
const currentToken    = ref('')
const isSessionActive = ref(false)
const isSessionEnded  = ref(false)

const isMakeupSession    = ref(false)
const makeupOriginalDate = ref('')

const endedAt   = ref('')
const isLoading = ref(false)
const countdown = ref(5)

// ── computed ────────────────────────────────────────────────────
const today = computed(() => new Date().toISOString().slice(0, 10))

const todayFormatted = computed(() =>
  new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
)

// LocalDateTime 문자열 안전 파싱 ("2026-05-07T10:30:00" 또는 "2026-05-07 10:30:00")
const endedAtFormatted = computed(() => {
  if (!endedAt.value) return ''
  const d = new Date(String(endedAt.value).replace(' ', 'T'))
  if (isNaN(d.getTime())) return endedAt.value
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
})

const countdownWidth = computed(() => (countdown.value / 5) * 100)

const makeupOriginalDateFormatted = computed(() => {
  if (!makeupOriginalDate.value) return ''
  const d = new Date(String(makeupOriginalDate.value).replace(' ', 'T'))
  if (isNaN(d.getTime())) return makeupOriginalDate.value
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
})

// ── 내부 변수 ────────────────────────────────────────────────────
let eventSourceRef = null
let countTimerRef  = null

// ── SSE + 카운트다운 시작 ────────────────────────────────────────
function startStream(sid) {
  eventSourceRef = attendanceService.openTokenStream(
    sid,
    (token) => { currentToken.value = token; countdown.value = 5 },
    (err)   => { console.error('QR 스트림 오류', err) },
  )
  countTimerRef = setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1
  }, 1000)
}

// ── SSE + 카운트다운 정리 ────────────────────────────────────────
function stopStream() {
  if (eventSourceRef) { eventSourceRef.close(); eventSourceRef = null }
  clearInterval(countTimerRef); countTimerRef = null
}

// ── 일반 출석 시작 ───────────────────────────────────────────────
async function handleStartSession() {
  isLoading.value = true
  try {
    const data = await attendanceService.createSession(lectureId, today.value)
    sessionId.value       = data.sessionId
    lecture.value         = { lectureName: data.lectureName, lectureRoom: data.lectureRoom }
    isSessionActive.value = true
    startStream(data.sessionId)
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 보강 세션 자동 시작 (쿼리 파라미터로 진입 시) ────────────────
async function handleStartMakeupSession() {
  isLoading.value = true
  try {
    const data = await attendanceService.createMakeupSession(
      lectureId,
      today.value + 'T00:00:00',
      makeupQueryDate + 'T00:00:00',
    )
    sessionId.value          = data.sessionId
    makeupOriginalDate.value = data.originalDate ?? makeupQueryDate
    lecture.value            = { lectureName: data.lectureName, lectureRoom: data.lectureRoom }
    isMakeupSession.value    = true
    isSessionActive.value    = true
    startStream(data.sessionId)
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
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
    const data = await attendanceService.endSession(lectureId, sessionId.value)
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
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 마운트: 보강 모드이면 자동으로 세션 시작 ────────────────────
onMounted(() => {
  if (isMakeupMode && makeupQueryDate) {
    handleStartMakeupSession()
  }
})

onUnmounted(() => stopStream())
</script>

<style scoped lang="scss">
.attendance-qr-page {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 강의 정보 카드 */
.lecture-info-card {
  background: #f8f9fa; border: 1px solid #e0e0e0;
  border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.lecture-info-row { display: flex; gap: 12px; }
.info-label { width: 60px; font-size: 13px; color: #888; flex-shrink: 0; }
.info-value { font-size: 14px; font-weight: 600; color: #222; }

/* 대기 상태 */
.standby-section {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 40px 0;
}
.standby-text { font-size: 15px; color: #555; }

/* 진행 중 */
.active-section { display: flex; flex-direction: column; align-items: center; gap: 24px; }
.makeup-badge {
  background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px;
  padding: 8px 16px; font-size: 13px; font-weight: 600; color: #856404;
  width: 100%; text-align: center;
}

/* QR 영역 */
.qr-wrapper {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: #fff; border: 2px solid #4a7cf7; border-radius: 16px;
  padding: 24px; width: 100%;
}
.qr-guide { font-size: 14px; color: #555; margin: 0; }
.qr-image { border-radius: 8px; }
.qr-loading {
  width: 280px; height: 280px;
  display: flex; align-items: center; justify-content: center;
  background: #f4f6ff; border-radius: 8px; font-size: 14px; color: #888;
}
.countdown-bar-wrap { width: 280px; height: 6px; background: #e8e8e8; border-radius: 3px; overflow: hidden; }
.countdown-bar { height: 100%; background: #4a7cf7; border-radius: 3px; transition: width 0.9s linear; }
.countdown-text { font-size: 12px; color: #888; margin: 0; }

/* 종료 구역 */
.end-section { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
.end-warning { font-size: 13px; color: #e05c00; margin: 0; }

/* 결과 화면 */
.result-section {
  background: #f0faf0; border: 1px solid #b2dfdb;
  border-radius: 12px; padding: 24px; text-align: center;
  display: flex; flex-direction: column; gap: 8px;
}
.result-title { font-size: 18px; font-weight: 700; color: #2e7d32; margin: 0; }
.result-text { font-size: 15px; color: #333; margin: 0; }
.result-sub { font-size: 12px; color: #888; margin-top: 8px; }

/* 공용 버튼 */
.btn {
  padding: 12px 40px; border: none; border-radius: 8px;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.btn-start { background: #4a7cf7; color: #fff; &:hover:not(:disabled) { opacity: 0.85; } }
  &.btn-end   { background: #e53935; color: #fff; width: 100%; &:hover:not(:disabled) { opacity: 0.85; } }
}
</style>
