<template>
  <div class="lec-list-page">
    <h2 class="page-title">출석 관리</h2>

    <!-- 학년도 / 학기 필터 -->
    <div class="filter-bar">
      <select v-model="filter.year" class="filter-select">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년도</option>
      </select>
      <select v-model="filter.semester" class="filter-select">
        <option :value="1">1학기</option>
        <option :value="2">2학기</option>
      </select>
      <button class="btn btn-search" @click="fetchLectures" :disabled="isLoading">
        {{ isLoading ? '조회 중...' : '조회' }}
      </button>
    </div>

    <!-- 빈 결과 -->
    <div v-if="!isLoading && lectures.length === 0" class="empty-state">
      담당 강의가 없습니다.
    </div>

    <!-- 강의 카드 목록 -->
    <ul class="lecture-list">
      <li v-for="lec in lectures" :key="lec.lectureId" class="lecture-card">
        <div class="lecture-info">
          <div class="lecture-name">{{ lec.lectureName }}</div>
          <div class="lecture-meta">
            <span>{{ lec.majorName }}</span>
            <span class="dot">·</span>
            <span>{{ lec.credit }}학점</span>
            <span class="dot">·</span>
            <span>{{ lec.academicYear }}학년</span>
            <span v-if="lec.lectureType" class="dot">·</span>
            <span v-if="lec.lectureType" class="type-badge">{{ formatLectureType(lec.lectureType) }}</span>
          </div>
          <div class="lecture-schedule">
            <span v-for="(s, i) in lec.schedules" :key="i" class="schedule-chip">
              {{ formatSchedule(s) }}
            </span>
          </div>
        </div>
        <button class="btn-qr" @click="openActionModal(lec)">
          QR 시작
        </button>
      </li>
    </ul>

    <!-- ── 액션 모달 ──────────────────────────────────────────── -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">

        <!-- Step 1: 액션 선택 -->
        <template v-if="modalStep === 'action'">
          <h3 class="modal-title">{{ activeLecture?.lectureName }}</h3>
          <p class="modal-subtitle">진행할 작업을 선택하세요.</p>

          <div class="action-list">
            <button class="action-btn btn-attend" @click="goToQR">
              <span class="action-icon">📋</span>
              <div class="action-text">
                <span class="action-label">출석 시작</span>
                <span class="action-desc">QR 코드를 생성하고 출석을 시작합니다</span>
              </div>
            </button>
            <button class="action-btn btn-cancel-class" @click="handleCancelClass" :disabled="isActionLoading">
              <span class="action-icon">🚫</span>
              <div class="action-text">
                <span class="action-label">휴강처리</span>
                <span class="action-desc">오늘 수업을 휴강으로 등록합니다</span>
              </div>
            </button>
            <button class="action-btn btn-makeup" @click="openMakeupStep" :disabled="isActionLoading">
              <span class="action-icon">🔄</span>
              <div class="action-text">
                <span class="action-label">보강 QR 생성</span>
                <span class="action-desc">이전 휴강 날짜에 대한 보강을 시작합니다</span>
              </div>
            </button>
          </div>

          <button class="btn btn-gray close-btn" @click="closeModal">닫기</button>
        </template>

        <!-- Step 2: 보강 날짜 선택 -->
        <template v-else-if="modalStep === 'makeup-dates'">
          <h3 class="modal-title">보강할 휴강 날짜 선택</h3>
          <p class="modal-subtitle">{{ activeLecture?.lectureName }}</p>

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
            <button class="btn btn-gray" @click="modalStep = 'action'">뒤로</button>
            <button class="btn btn-primary" :disabled="!selectedCancelDate" @click="goToMakeupQR">
              보강 QR 시작
            </button>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import attendLectureService from '@/services/attendLectureService.js'
import attendanceService from '@/services/attendanceService.js'
import { useModalStore } from '@/stores/modal.js'

const router = useRouter()
const modal  = useModalStore()

// ── 필터 ────────────────────────────────────────────────────────
const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

const filter = ref({
  year:     currentYear,
  semester: new Date().getMonth() < 6 ? 1 : 2,
})

// ── 강의 목록 ───────────────────────────────────────────────────
const lectures  = ref([])
const isLoading = ref(false)

async function fetchLectures() {
  isLoading.value = true
  try {
    const data = await attendLectureService.getMyLectures({
      year:     filter.value.year,
      semester: filter.value.semester,
    })
    lectures.value = Array.isArray(data) ? data : (data.content ?? data.data ?? [])
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchLectures)

// ── 모달 상태 ───────────────────────────────────────────────────
const showModal       = ref(false)
const modalStep       = ref('action')   // 'action' | 'makeup-dates'
const activeLecture   = ref(null)
const isActionLoading = ref(false)

const cancelledDates     = ref([])
const selectedCancelDate = ref('')

function openActionModal(lec) {
  activeLecture.value      = lec
  modalStep.value          = 'action'
  selectedCancelDate.value = ''
  showModal.value          = true
}

function closeModal() {
  showModal.value     = false
  activeLecture.value = null
}

// ── 출석 시작 → QR 페이지 이동 ──────────────────────────────────
function goToQR() {
  router.push(`/attendances/${activeLecture.value.lectureId}/qr`)
}

// ── 휴강처리 ─────────────────────────────────────────────────────
async function handleCancelClass() {
  const today = new Date().toISOString().slice(0, 10)
  const confirmed = await modal.showConfirm(
    `오늘(${today}) 수업을 휴강 처리하시겠습니까?\n수강 학생 전원이 휴강으로 등록됩니다.`,
    'warning',
  )
  if (!confirmed) return

  isActionLoading.value = true
  try {
    await attendanceService.cancelClass(activeLecture.value.lectureId, today)
    closeModal()
    await modal.showAlert('오늘 수업이 휴강 처리되었습니다.', 'success')
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isActionLoading.value = false
  }
}

// ── 보강 날짜 선택 단계로 ────────────────────────────────────────
async function openMakeupStep() {
  isActionLoading.value = true
  try {
    const res  = await attendanceService.getCancelledDates(activeLecture.value.lectureId)
    const list = res.data ?? res
    const available = list.filter(item => !item.makeupDate)

    if (available.length === 0) {
      await modal.showAlert('보강 가능한 휴강 날짜가 없습니다.', 'info')
      return
    }
    cancelledDates.value     = available
    selectedCancelDate.value = ''
    modalStep.value          = 'makeup-dates'
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isActionLoading.value = false
  }
}

// ── 보강 QR → QR 페이지로 이동 (쿼리로 날짜 전달) ────────────────
function goToMakeupQR() {
  if (!selectedCancelDate.value) return
  router.push({
    path:  `/attendances/${activeLecture.value.lectureId}/qr`,
    query: { mode: 'makeup', originalDate: selectedCancelDate.value },
  })
}

// ── 포맷 유틸 ────────────────────────────────────────────────────
const DAY_KO = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
  FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
  MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
}

function formatSchedule(s) {
  const day  = DAY_KO[s.dayOfWeek] ?? s.dayOfWeek
  const room = [s.building, s.room].filter(Boolean).join(' ')
  return `${day} ${s.startPeriod}~${s.endPeriod}교시${room ? ` (${room})` : ''}`
}

const LECTURE_TYPE_KO = { MAJOR: '전공', GENERAL: '교양', REQUIRED: '필수', ELECTIVE: '선택' }
function formatLectureType(type) { return LECTURE_TYPE_KO[type] ?? type }

function formatCancelDate(dateStr) {
  const d = new Date(String(dateStr).replace(' ', 'T'))
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}
</script>

<style scoped lang="scss">
.lec-list-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title { font-size: 20px; font-weight: 700; color: #222; margin: 0; }

/* 필터 */
.filter-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.filter-select {
  padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px;
  font-size: 14px; color: #333; background: #fff; cursor: pointer;
}

/* 빈 상태 */
.empty-state { text-align: center; padding: 60px 0; font-size: 15px; color: #aaa; }

/* 강의 목록 */
.lecture-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.lecture-card {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #e8e8e8; border-radius: 12px;
  padding: 18px 20px; gap: 16px; transition: box-shadow 0.15s;
  &:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
}
.lecture-info { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.lecture-name { font-size: 16px; font-weight: 700; color: #222; }
.lecture-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: #666; flex-wrap: wrap;
}
.dot { color: #ccc; }
.type-badge {
  background: #e8f4ff; color: #1565c0; border-radius: 4px;
  padding: 1px 6px; font-size: 11px; font-weight: 600;
}
.lecture-schedule { display: flex; flex-wrap: wrap; gap: 6px; }
.schedule-chip {
  background: #f5f5f5; border-radius: 6px; padding: 3px 8px;
  font-size: 12px; color: #555;
}

/* QR 시작 버튼 */
.btn-qr {
  background: #4a7cf7; color: #fff; border: none;
  padding: 10px 20px; border-radius: 8px; font-size: 14px;
  font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: opacity 0.2s;
  &:hover { opacity: 0.85; }
}

/* 모달 */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  background: #fff; border-radius: 16px; padding: 28px 24px;
  width: 380px; max-width: 92vw;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-title {
  font-size: 17px; font-weight: 700; color: #222; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.modal-subtitle { font-size: 13px; color: #888; margin: -8px 0 0; }

/* 액션 버튼 */
.action-list { display: flex; flex-direction: column; gap: 10px; }
.action-btn {
  display: flex; align-items: center; gap: 14px; width: 100%;
  padding: 14px 16px; border: 2px solid transparent; border-radius: 12px;
  cursor: pointer; text-align: left; background: transparent;
  transition: background 0.15s, border-color 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-icon { font-size: 24px; flex-shrink: 0; }
  .action-text { display: flex; flex-direction: column; gap: 2px; }
  .action-label { font-size: 15px; font-weight: 700; color: #222; }
  .action-desc  { font-size: 12px; color: #888; }
  &.btn-attend      { background: #f0f4ff; border-color: #c5d3ff; &:hover:not(:disabled) { background: #dde8ff; } }
  &.btn-cancel-class{ background: #fff4f0; border-color: #ffd0c0; &:hover:not(:disabled) { background: #ffe5db; } }
  &.btn-makeup      { background: #f0fff4; border-color: #b9edc6; &:hover:not(:disabled) { background: #d6f5e0; } }
}

/* 보강 날짜 선택 */
.cancel-date-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.cancel-date-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border: 2px solid #e0e0e0; border-radius: 10px;
  cursor: pointer; transition: border-color 0.15s;
  &:hover { border-color: #4a7cf7; }
  &.selected { border-color: #4a7cf7; background: #f0f4ff; }
}
.cancel-date-text { font-size: 14px; font-weight: 600; color: #222; }
.cancel-date-badge { font-size: 11px; padding: 2px 8px; border-radius: 20px; background: #fff3e0; color: #e65100; }

.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
.close-btn { width: 100%; }

/* 공용 버튼 */
.btn {
  padding: 10px 22px; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.btn-search  { background: #4a7cf7; color: #fff; &:hover:not(:disabled) { opacity: 0.85; } }
  &.btn-primary { background: #4a7cf7; color: #fff; &:hover:not(:disabled) { opacity: 0.85; } }
  &.btn-gray    { background: #e0e0e0; color: #555; &:hover:not(:disabled) { opacity: 0.85; } }
}
</style>
