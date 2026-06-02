<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'

const router = useRouter()

// ── 상태값 ────────────────────────────────────────────
const allLectures  = ref([])       // API 전체 데이터
const selectedYear = ref(null)
const selectedSemester = ref(null)
const activeLecture = ref(null)    // 상세보기 대상 (null이면 목록 화면)
const isLoading = ref(false)

// ── 학기 옵션 (실제 데이터 기반 — 성적 페이지와 동일 패턴) ──
// Set을 쓰는 이유: 여러 강의가 같은 학기여도 탭은 1개만 나와야 해서 중복 제거용
const semesterOptions = computed(() => {
  const seen = new Set()
  const result = []
  for (const lec of allLectures.value) {
    const key = `${lec.lectureYear}-${lec.lectureSemester}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ year: lec.lectureYear, semester: lec.lectureSemester })
    }
  }
  return result.sort((a, b) => b.year - a.year || b.semester - a.semester)
})

// ── 선택된 학기의 강의 목록 ───────────────────────────
const filteredLectures = computed(() => {
  if (!selectedYear.value || !selectedSemester.value) return []
  return allLectures.value.filter(
    lec => lec.lectureYear === selectedYear.value &&
           lec.lectureSemester === selectedSemester.value
  )
})

// ── 유틸 함수 ─────────────────────────────────────────
// 출석률: 출석+지각을 출석으로 인정 (기존 로직 유지)
function attendRate(lec) {
  if (!lec.totalCount) return 0
  return Math.round(((lec.attendCount + lec.lateCount) / lec.totalCount) * 100)
}

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

// ── 이벤트 핸들러 ─────────────────────────────────────
function selectSemester(option) {
  selectedYear.value = option.year
  selectedSemester.value = option.semester
  activeLecture.value = null  // 상세보기 닫기
}

// 강의 클릭 → 상세보기
function openDetail(lec) {
  activeLecture.value = lec
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 뒤로가기 → 강의 목록
function goBack() {
  activeLecture.value = null
}

// ── API 호출 ──────────────────────────────────────────
async function fetchMyAttendance() {
  isLoading.value = true
  try {
    const res = await attendanceService.getMyAttendance()
    allLectures.value = res.data ?? res

    // 가장 최신 학기 자동 선택
    if (semesterOptions.value.length > 0) {
      const latest = semesterOptions.value[0]
      selectedYear.value = latest.year
      selectedSemester.value = latest.semester
    }
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

// ── onMounted (항상 마지막) ───────────────────────────
onMounted(async () => {
  await fetchMyAttendance()
})
</script>

<template>
  <div class="my-attend-page">

    <!-- 로딩 -->
    <div v-if="isLoading" class="hint">출석 정보를 불러오는 중...</div>

    <!-- 데이터 없음 -->
    <div v-else-if="allLectures.length === 0" class="hint">
      수강 중인 강의의 출석 기록이 없습니다.
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════ -->
      <!-- 상세보기 (activeLecture 있을 때)           -->
      <!-- ══════════════════════════════════════════ -->
      <div v-if="activeLecture">

        <!-- 헤더 -->
        <div class="detail-header">
          <button class="btn-back" @click="goBack">← 목록으로</button>
          <h2 class="detail-title">출결 조회</h2>
        </div>

        <!-- 강의 정보 박스 -->
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">과 목</span>
            <span class="info-value">{{ activeLecture.lectureName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">교 수</span>
            <span class="info-value">{{ activeLecture.professorName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">일 시</span>
            <span class="info-value">{{ activeLecture.scheduleInfo }}</span>
          </div>
        </div>

        <!-- 출결 현황 요약 -->
        <div class="summary-line">
          출석 / 지각 / 결석 :
          <strong>{{ activeLecture.attendCount }}</strong> /
          <strong>{{ activeLecture.lateCount }}</strong> /
          <strong>{{ activeLecture.absentCount }}</strong>
        </div>

        <!-- 출결 기록 표 -->
        <div class="record-table-wrap">
          <table class="record-table">
            <thead>
              <tr>
                <th class="col-no">번호</th>
                <th class="col-date">강의날짜(요일)</th>
                <th class="col-time">출결일시</th>
                <th class="col-status">출결</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(d, idx) in activeLecture.details"
                :key="idx"
              >
                <td class="col-no">{{ idx + 1 }}</td>
                <td class="col-date">{{ d.attendDate }}</td>
                <td class="col-time">{{ d.attendedAt ?? '-' }}</td>
                <td class="col-status">
                  <span v-if="d.status" :class="['status-badge', statusClass(d.status)]">
                    {{ statusLabel(d.status) }}
                  </span>
                  <span v-else class="status-badge absent">결석</span>
                </td>
              </tr>
              <tr v-if="!activeLecture.details?.length">
                <td colspan="4" class="empty-row">출석 기록이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════════════════════════════════════ -->
      <!-- 목록보기 (activeLecture 없을 때)           -->
      <!-- ══════════════════════════════════════════ -->
      <div v-else>
        <h2 class="page-title">내 출석 현황</h2>

        <!-- 학기 탭 -->
        <div class="semester-tabs">
          <button
            v-for="opt in semesterOptions"
            :key="`${opt.year}-${opt.semester}`"
            class="semester-tab"
            :class="{ active: opt.year === selectedYear && opt.semester === selectedSemester }"
            @click="selectSemester(opt)"
          >
            {{ opt.year }}년 {{ opt.semester }}학기
          </button>
        </div>

        <!-- 강의 목록 -->
        <div class="lecture-list">
          <div
            v-for="lec in filteredLectures"
            :key="lec.lectureId"
            class="lecture-card"
            @click="openDetail(lec)"
          >
            <div class="card-header">
              <span class="lec-name">{{ lec.lectureName }}</span>
              <span class="arrow-icon">›</span>
            </div>
          </div>

          <div v-if="filteredLectures.length === 0" class="hint">
            해당 학기의 강의가 없습니다.
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.my-attend-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px $size-df;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $font-color;
  margin-bottom: 16px;
}

.hint {
  text-align: center;
  padding: 40px 0;
  font-size: 0.875rem;
  color: $font-color-light;
}

/* ── 학기 탭 ── */
.semester-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;   /* 탭이 많아져도 자동으로 다음 줄로 */
  margin-bottom: 16px;
}

.semester-tab {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid $border-color;
  background: #fff;
  font-size: 0.875rem;
  color: $font-color-light;
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    background: $green-600;
    color: #fff;
    border-color: transparent;
  }
}

/* ── 강의 목록 ── */
.lecture-list { display: flex; flex-direction: column; gap: 10px; }

.lecture-card {
  background: #fff;
  border: 1px solid $border-color;
  border-radius: $radius-df;
  overflow: hidden;
  cursor: pointer;

  &:active { background: $hover-bg-color; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: $hover-bg-color;
  border-bottom: 1px solid $border-color;
}

.header-left { display: flex; flex-direction: column; gap: 4px; }

.lec-name {
  font-size: 1rem;
  font-weight: 700;
  color: $font-color;
}

.attend-rate {
  font-size: 0.875rem;
  font-weight: 600;
  &.rate-good { color: #2e7d32; }
  &.rate-warn { color: #f57f17; }
  &.rate-bad  { color: #c62828; }
}

.arrow-icon {
  font-size: 22px;
  color: $font-color-light;
}

/* ── 상세보기 헤더 ── */
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-back {
  background: none;
  border: none;
  font-size: 0.875rem;
  color: $green-600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: $font-color;
}

/* ── 상세보기 요약 박스 ── */
.summary-box {
  background: $hover-bg-color;
  border-radius: $radius-df;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.rate-line {
  font-size: 0.875rem;
  color: $font-color-light;
  margin-bottom: 10px;

  span {
    font-weight: 700;
    margin-left: 6px;
    &.rate-good { color: #2e7d32; }
    &.rate-warn { color: #f57f17; }
    &.rate-bad  { color: #c62828; }
  }
}

/* ── 요약 칩 (목록·상세 공통) ── */
.summary-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 16px;
}

.summary-chip {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  &.attend { background: #e6f9ee; color: #2e7d32; }
  &.late   { background: #fff8e1; color: #f57f17; }
  &.early  { background: #fff3e0; color: #e65100; }
  &.absent { background: #fdecea; color: #c62828; }
  &.total  { background: $hover-bg-color; color: $green-600; }
}

/* ── 날짜별 기록 ── */
.record-list {
  border: 1px solid $border-color;
  border-radius: $radius-df;
  overflow: hidden;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-bottom: 1px solid $border-color;
  &:last-child { border-bottom: none; }
  &:hover { background: $hover-bg-color; }
}

.record-date {
  font-size: 0.875rem;
  color: $font-color;
  min-width: 160px; /* (휴강)·(보강) 레이블 포함 시 여유 확보 */
}

.record-time {
  font-size: 0.75rem;
  color: $green-600;
  font-weight: 600;
}

.record-reason {
  font-size: 0.75rem;
  color: $font-color-light;
}

/* ── 상태 뱃지 ── */
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  &.attend      { background: #e6f9ee; color: #2e7d32; }
  &.absent      { background: #fdecea; color: #c62828; }
  &.late        { background: #fff8e1; color: #f57f17; }
  &.early-leave { background: #fff3e0; color: #e65100; }
}

/* ── 강의 정보 카드 ── */
.info-card {
  background: $hover-bg-color;
  border-radius: $radius-df;
  padding: 14px 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-label {
  font-size: 0.875rem;
  color: $font-color-light;
  min-width: 40px;
  white-space: nowrap;
}

.info-value {
  font-size: 0.875rem;
  color: $font-color;
  font-weight: 600;
}

/* ── 출결 요약 한 줄 ── */
.summary-line {
  font-size: 0.875rem;
  color: $font-color-light;
  margin-bottom: 12px;

  strong {
    color: $font-color;
    font-weight: 700;
  }
}

/* ── 출결 기록 표 ── */
.record-table-wrap {
  border: 1px solid $border-color;
  border-radius: $radius-df;
  overflow: hidden;
}

.record-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  thead tr {
    background: $hover-bg-color;
  }

  th, td {
    padding: 10px 8px;
    text-align: center;
    border-bottom: 1px solid $border-color;
    color: $font-color;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: $hover-bg-color;
  }
}

.col-no     { width: 36px; }
.col-date   { text-align: left; padding-left: 12px !important; }
.col-time   { width: 56px; color: $green-600; font-weight: 600; }
.col-status { width: 60px; }

.empty-row {
  text-align: center;
  color: $font-color-light;
  padding: 24px 0 !important;
}
</style>