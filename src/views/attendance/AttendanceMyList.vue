<template>
  <div class="my-attend-page">
    <!-- [추가] PWA 모바일(/student/attendances) 진입 시 홈으로 돌아가기 버튼 -->
    <button v-if="isMobilePwa" class="btn-back" @click="router.push('/student/attendances/home')">
      ← 홈으로 돌아가기
    </button>
    <h2 class="page-title">내 출석 현황</h2>

    <!-- 로딩 -->
    <div v-if="isLoading" class="hint">출석 정보를 불러오는 중...</div>

    <!-- 데이터 없음 -->
    <div v-else-if="lectures.length === 0" class="hint">수강 중인 강의의 출석 기록이 없습니다.</div>

    <!-- 강의별 출석 카드 -->
    <div v-else class="lecture-list">
      <div v-for="lec in lectures" :key="lec.lectureId" class="lecture-card">

        <!-- 강의 헤더 -->
        <div class="card-header" @click="toggleDetail(lec.lectureId)">
          <div class="header-left">
            <span class="lec-name">{{ lec.lectureName }}</span>
            <!-- 출석률 계산: (출석+지각) / 전체 -->
            <span class="attend-rate" :class="rateClass(lec)">
              출석률 {{ attendRate(lec) }}%
            </span>
          </div>
          <span class="toggle-icon">{{ openIds.has(lec.lectureId) ? '▲' : '▼' }}</span>
        </div>

        <!-- 요약 뱃지 -->
        <div class="summary-row">
          <span class="summary-chip attend">출석 {{ lec.attendCount }}</span>
          <span class="summary-chip late">지각 {{ lec.lateCount }}</span>
          <span class="summary-chip early">조퇴 {{ lec.earlyLeaveCount }}</span>
          <span class="summary-chip absent">결석 {{ lec.absentCount }}</span>
          <span class="summary-chip total">총 {{ lec.totalCount }}회</span>
        </div>

        <!-- 세부 이력 (토글) -->
        <div v-if="openIds.has(lec.lectureId)" class="detail-list">
          <div
            v-for="(d, idx) in lec.details"
            :key="idx"
            class="detail-row"
          >
            <span class="detail-date">{{ d.attendDate }}</span>
            <span :class="['status-badge', statusClass(d.status)]">
              {{ statusLabel(d.status) }}
            </span>
            <span v-if="d.reason" class="detail-reason">{{ d.reason }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'

const router = useRouter()
const route  = useRoute()

// [추가] /student/attendances/** 경로면 출석 전용 PWA 진입 → 뒤로가기 버튼 표시
const isMobilePwa = computed(() => route.path.startsWith('/student/attendances'))

// ── 상태 ────────────────────────────────────────────────────────────────────
const lectures  = ref([])
const isLoading = ref(true)

// 펼쳐진 강의 ID 목록 (Set으로 토글)
const openIds = ref(new Set())

// ── 데이터 로드 ──────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await attendanceService.getMyAttendance()
    // res = ResultResponse → res.data = List<AttendStuListRes>
    lectures.value = res.data ?? res
  } catch {
    // 에러는 httpRequester 인터셉터가 모달로 처리
  } finally {
    isLoading.value = false
  }
})

// ── 세부 이력 토글 ────────────────────────────────────────────────────────────
function toggleDetail(lectureId) {
  const s = new Set(openIds.value)
  s.has(lectureId) ? s.delete(lectureId) : s.add(lectureId)
  openIds.value = s
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
// 출석률: (출석 + 지각) / 전체 × 100 (지각도 출석으로 인정)
function attendRate(lec) {
  if (!lec.totalCount) return 0
  return Math.round(((lec.attendCount + lec.lateCount) / lec.totalCount) * 100)
}

// 출석률에 따른 색 클래스
function rateClass(lec) {
  const rate = attendRate(lec)
  if (rate >= 90) return 'rate-good'
  if (rate >= 70) return 'rate-warn'
  return 'rate-bad'
}

function statusLabel(code) {
  return { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }[code] ?? code
}

function statusClass(code) {
  return { ATTEND: 'attend', ABSENT: 'absent', LATE: 'late', EARLY_LEAVE: 'early-leave' }[code] ?? ''
}
</script>

<style scoped lang="scss">
.my-attend-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px 16px;
}

/* [추가] PWA 모바일 뒤로가기 버튼 */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 8px 14px;
  background: #f0f4ff;
  color: #4a7cf7;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #dde8ff; }
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin-bottom: 24px;
}

.hint {
  text-align: center;
  padding: 60px 0;
  font-size: 14px;
  color: #aaa;
}

/* ── 강의 카드 ── */
.lecture-list { display: flex; flex-direction: column; gap: 14px; }

.lecture-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}

/* 카드 헤더: 강의명 + 출석률 + 토글 버튼 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #f8f9ff;
  border-bottom: 1px solid #eee;
  user-select: none;
  &:hover { background: #eef2ff; }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lec-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.attend-rate {
  font-size: 13px;
  font-weight: 600;
  &.rate-good { color: #2e7d32; }
  &.rate-warn { color: #f57f17; }
  &.rate-bad  { color: #c62828; }
}

.toggle-icon {
  font-size: 13px;
  color: #999;
}

/* 요약 뱃지 */
.summary-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.summary-chip {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  &.attend  { background: #e6f9ee; color: #2e7d32; }
  &.late    { background: #fff8e1; color: #f57f17; }
  &.early   { background: #fff3e0; color: #e65100; }
  &.absent  { background: #fdecea; color: #c62828; }
  &.total   { background: #f0f4ff; color: #4a7cf7; }
}

/* 세부 이력 */
.detail-list {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid #fafafa;
  &:last-child { border-bottom: none; }
}

.detail-date {
  font-size: 13px;
  color: #555;
  min-width: 130px;
}

.detail-reason {
  font-size: 12px;
  color: #999;
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  &.attend       { background: #e6f9ee; color: #2e7d32; }
  &.absent       { background: #fdecea; color: #c62828; }
  &.late         { background: #fff8e1; color: #f57f17; }
  &.early-leave  { background: #fff3e0; color: #e65100; }
}
</style>