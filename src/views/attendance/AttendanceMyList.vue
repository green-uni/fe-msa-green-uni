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

/* [수정] 1차 프로젝트 공통 디자인 토큰(CSS 변수)으로 통일 */
<style scoped lang="scss">
.my-attend-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px var(--size-df);
}

/* PWA 모바일 뒤로가기 버튼 */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 8px 14px;
  background: var(--hover-bg-color);
  color: var(--main-color);
  border: 1px solid var(--main-color);
  border-radius: var(--bdrs-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--main-color); color: #fff; }
}

.page-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--font-color);
  margin-bottom: 24px;
}

.hint {
  text-align: center;
  padding: 60px 0;
  font-size: var(--text-sm);
  color: var(--font-color-light);
}

/* ── 강의 카드 ── */
.lecture-list { display: flex; flex-direction: column; gap: 12px; }

.lecture-card {
  background: #fff;
  border: 1px solid var(--line-color);
  border-radius: var(--bdrs-df);
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}

/* 카드 헤더 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  background: var(--hover-bg-color);
  border-bottom: 1px solid var(--line-color);
  user-select: none;
  &:hover { background: #eaf5ef; }
}

.header-left { display: flex; flex-direction: column; gap: 4px; }

.lec-name {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--font-color);
}

.attend-rate {
  font-size: var(--text-sm);
  font-weight: 600;
  &.rate-good { color: #2e7d32; }
  &.rate-warn { color: #f57f17; }
  &.rate-bad  { color: #c62828; }
}

.toggle-icon { font-size: var(--text-sm); color: var(--font-color-light); }

/* 요약 뱃지 */
.summary-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 20px;
  border-bottom: 1px solid var(--line-color);
}

.summary-chip {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: var(--text-xs);
  font-weight: 700;
  &.attend  { background: #e6f9ee; color: #2e7d32; }
  &.late    { background: #fff8e1; color: #f57f17; }
  &.early   { background: #fff3e0; color: #e65100; }
  &.absent  { background: #fdecea; color: #c62828; }
  &.total   { background: var(--hover-bg-color); color: var(--main-color); }
}

/* 세부 이력 */
.detail-list { display: flex; flex-direction: column; padding: 4px 0; }

.detail-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 20px;
  border-bottom: 1px solid var(--line-color);
  &:last-child { border-bottom: none; }
  &:hover { background: var(--default-hover-bg-color); }
}

.detail-date {
  font-size: var(--text-sm);
  color: var(--font-color);
  min-width: 130px;
}

.detail-reason {
  font-size: var(--text-xs);
  color: var(--font-color-light);
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: 700;
  &.attend      { background: #e6f9ee; color: #2e7d32; }
  &.absent      { background: #fdecea; color: #c62828; }
  &.late        { background: #fff8e1; color: #f57f17; }
  &.early-leave { background: #fff3e0; color: #e65100; }
}
</style>