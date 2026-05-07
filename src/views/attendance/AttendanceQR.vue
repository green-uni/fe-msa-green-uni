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

    <!-- 대기 상태: 세션 시작 전 -->
    <div v-if="!isSessionActive && !isSessionEnded && !isClassCancelled" class="standby-section">
      <p class="standby-text">출석 시작 버튼을 누르면 QR이 활성화됩니다.</p>
      <div class="standby-buttons">
        <button class="btn btn-start" @click="handleStartSession" :disabled="isLoading">
          {{ isLoading ? '세션 생성 중...' : '출석 시작' }}
        </button>
        <button class="btn btn-cancel-class" @click="handleCancelClass" :disabled="isLoading">
          휴강처리
        </button>
        <button class="btn btn-makeup" @click="handleOpenMakeupModal" :disabled="isLoading">
          보강 QR 생성
        </button>
      </div>
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

    <!-- 휴강 처리 완료 -->
    <div v-if="isClassCancelled" class="cancel-section">
      <h3 class="cancel-title">🚫 오늘 수업이 휴강 처리되었습니다</h3>
      <p class="cancel-sub">수강 학생 전원의 출석 상태가 휴강으로 등록됩니다.</p>
    </div>

    <!-- 보강 날짜 선택 모달 -->
    <div v-if="showMakeupModal" class="modal-backdrop" @click.self="showMakeupModal = false">
      <div class="modal-box">
        <h3 class="modal-title">보강할 휴강 날짜 선택</h3>

        <ul class="cancel-date-list">
          <li
            v-for="item in cancelledDates"
            :key="item.cancelDate"
            class="cancel-date-item"
            :class="{ selected: selectedCancelDate === item.cancelDate }"
            @click="selectedCancelDate = item.cancelDate"
          >
            <span class="cancel-date-text">{{ formatCancelDate(item.cancelDate) }}</span>
            <span class="cancel-date-badge">보강 미완료</span>
          </li>
        </ul>

        <div class="modal-actions">
          <button class="btn btn-gray" @click="showMakeupModal = false">취소</button>
          <button
            class="btn btn-start"
            :disabled="!selectedCancelDate || isLoading"
            @click="handleStartMakeupSession"
          >
            {{ isLoading ? '생성 중...' : '보강 QR 시작' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useRoute } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'
import { useModalStore } from '@/stores/modal.js'

const route = useRoute()
const modal = useModalStore()
const lectureId = route.params.lectureId

// ── 상태값 ──────────────────────────────────────────────────────
const lecture = ref({ lectureName: '', lectureRoom: '' })

const sessionId        = ref(null)
const currentToken     = ref('')
const isSessionActive  = ref(false)
const isSessionEnded   = ref(false)
const isClassCancelled = ref(false)

const isMakeupSession    = ref(false)
const makeupOriginalDate = ref('')

const endedAt   = ref('')
const isLoading = ref(false)
const countdown = ref(5)

// 보강 모달
const showMakeupModal    = ref(false)
const cancelledDates     = ref([])
const selectedCancelDate = ref('')

// ── computed ────────────────────────────────────────────────────
const today = computed(() => new Date().toISOString().slice(0, 10))

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

// ── 내부 변수 ────────────────────────────────────────────────────
let eventSourceRef = null
let countTimerRef  = null

// ── 공통: SSE + 카운트다운 시작 ─────────────────────────────────
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

// ── 공통: SSE + 카운트다운 정리 ─────────────────────────────────
function stopStream() {
  if (eventSourceRef) { eventSourceRef.close(); eventSourceRef = null }
  clearInterval(countTimerRef); countTimerRef = null
}

// ── 출석 시작 ────────────────────────────────────────────────────
async function handleStartSession() {
  isLoading.value = true
  try {
    const data = await attendanceService.createSession(lectureId, today.value)
    sessionId.value = data.sessionId
    lecture.value   = { lectureName: data.lectureName, lectureRoom: data.lectureRoom }
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
    // API 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

// ── 휴강 처리 ────────────────────────────────────────────────────
async function handleCancelClass() {
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
    const data = await attendanceService.createMakeupSession(
      lectureId,
      today.value + 'T00:00:00',
      selectedCancelDate.value + 'T00:00:00',
    )
    sessionId.value          = data.sessionId
    makeupOriginalDate.value = data.originalDate ?? selectedCancelDate.value
    lecture.value            = { lectureName: data.lectureName, lectureRoom: data.lectureRoom }
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
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lecture-info-row { display: flex; gap: 12px; }
.info-label { width: 60px; font-size: 13px; color: #888; flex-shrink: 0; }
.info-value { font-size: 14px; font-weight: 600; color: #222; }

/* 대기 상태 */
.standby-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
}
.standby-text { font-size: 15px; color: #555; }
.standby-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 보강 배지 */
.active-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}
.makeup-badge {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #856404;
  width: 100%;
  text-align: center;
}

/* QR 영역 */
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 2px solid #4a7cf7;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
}
.qr-guide { font-size: 14px; color: #555; margin: 0; }
.qr-image { border-radius: 8px; }
.qr-loading {
  width: 280px; height: 280px;
  display: flex; align-items: center; justify-content: center;
  background: #f4f6ff; border-radius: 8px;
  font-size: 14px; color: #888;
}
.countdown-bar-wrap {
  width: 280px; height: 6px;
  background: #e8e8e8; border-radius: 3px; overflow: hidden;
}
.countdown-bar {
  height: 100%; background: #4a7cf7;
  border-radius: 3px; transition: width 0.9s linear;
}
.countdown-text { font-size: 12px; color: #888; margin: 0; }

/* 종료 구역 */
.end-section {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px; width: 100%;
}
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

/* 휴강 완료 화면 */
.cancel-section {
  background: #fff5f5; border: 1px solid #ffcdd2;
  border-radius: 12px; padding: 24px; text-align: center;
  display: flex; flex-direction: column; gap: 8px;
}
.cancel-title { font-size: 18px; font-weight: 700; color: #c62828; margin: 0; }
.cancel-sub { font-size: 13px; color: #888; }

/* 보강 날짜 선택 모달 */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: #fff; border-radius: 16px;
  padding: 28px 24px; width: 340px; max-width: 90vw;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-title { font-size: 16px; font-weight: 700; color: #222; margin: 0; }

.cancel-date-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.cancel-date-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border: 2px solid #e0e0e0;
  border-radius: 10px; cursor: pointer; transition: border-color 0.15s;
  &:hover { border-color: #4a7cf7; }
  &.selected { border-color: #4a7cf7; background: #f0f4ff; }
}
.cancel-date-text { font-size: 14px; font-weight: 600; color: #222; }
.cancel-date-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 20px;
  background: #fff3e0; color: #e65100;
}

.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

/* 공용 버튼 */
.btn {
  padding: 12px 24px; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.btn-start {
    background: #4a7cf7; color: #fff;
    &:hover:not(:disabled) { opacity: 0.85; }
  }
  &.btn-cancel-class {
    background: #ff7043; color: #fff;
    &:hover:not(:disabled) { opacity: 0.85; }
  }
  &.btn-makeup {
    background: #66bb6a; color: #fff;
    &:hover:not(:disabled) { opacity: 0.85; }
  }
  &.btn-end {
    background: #e53935; color: #fff; width: 100%;
    &:hover:not(:disabled) { opacity: 0.85; }
  }
  &.btn-gray {
    background: #e0e0e0; color: #555;
    &:hover:not(:disabled) { opacity: 0.85; }
  }
}
</style>
