<template>
  <div class="attendance-list-page">

    <!-- ── View 1: 강의 목록 (DataTable) ───────────────────────── -->
    <!-- [수정] 카드 레이아웃 → DataTable 컴포넌트로 교체 -->
    <template v-if="!selectedLecture">
      <div class="filter-header">
        <h2 class="page-title">출석 현황</h2>
      </div>

      <DataTable
        :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
        :rows="lectures"
        gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
        :isLoading="isLectureLoading"
        emptyMessage="담당 강의가 없습니다."
      >
        <article
          v-for="lec in lectures"
          :key="lec.lectureId"
          class="tbl-row lecture-row"
          @click="openRoster(lec)"
        >
          <div>{{ lec.lectureName }}</div>
          <div><span class="type-badge">{{ lec.lectureType }}</span></div>
          <div>{{ lec.year }}년 {{ lec.semester }}학기</div>
          <div>{{ lec.credit }}학점 / {{ lec.academicYear }}학년</div>
          <div class="schedule-cell">
            <span v-for="(sch, i) in lec.schedules" :key="i" class="schedule-item">
              {{ sch.dayOfWeek }}요일 {{ sch.startPeriod }}-{{ sch.endPeriod }}교시 · {{ sch.lectureRoom }}
            </span>
          </div>
        </article>
      </DataTable>
    </template>

    <!-- ── View 2: 출석부 ─────────────────────────────────────── -->
    <template v-else>
      <!-- 헤더 -->
      <div class="roster-header">
        <button class="back-btn" @click="closeRoster">← 강의 목록</button>
        <div class="lecture-title">
          <span class="type-badge">{{ selectedLecture.lectureType }}</span>
          <h2>{{ selectedLecture.lectureName }}</h2>
        </div>
      </div>

      <!-- 날짜 선택 + 액션 버튼 -->
      <div class="date-bar">
        <label class="date-label">수업 날짜</label>
        <!-- CalendarDate: highlightedDates로 출석 기록이 있는 날짜를 연두색으로 표시 -->
        <CalendarDate v-model="selectedDate" :highlightedDates="recordedDates" />
        <!-- 출석 기록이 있을 때만 수정 버튼 표시 -->
        <div class="action-btns" v-if="roster.length > 0">
          <button v-if="!isEditMode" class="btn btn-edit-mode" @click="isEditMode = true">수정</button>
          <template v-else>
            <button class="btn btn-save" :disabled="isSaving" @click="saveAttendance">저장</button>
            <button class="btn btn-cancel-edit" @click="cancelEditMode">취소</button>
          </template>
        </div>
        <span v-if="!isRosterLoading && roster.length === 0" class="no-session-msg">
          선택한 날짜에 출석 기록이 없습니다.
        </span>
      </div>

      <!-- [수정] 출석부 테이블: <table> → DataTable 컴포넌트로 교체 -->
      <DataTable
        :columns="['학년', '학과', '이름', '출결 상태', '비고']"
        :rows="roster"
        gridCols="0.8fr 1.8fr 1fr 2.5fr 2fr"
        :isLoading="isRosterLoading"
        emptyMessage="선택한 날짜에 출석 기록이 없습니다."
      >
        <!-- attendId는 출석 기록 없는 학생이면 null이 될 수 있어 key로 부적합 → studentCode 사용 -->
        <article v-for="row in roster" :key="row.studentCode" class="tbl-row">
          <div>{{ row.academic_year != null ? row.academic_year + '학년' : '-' }}</div>
          <div>{{ row.major_name ?? '-' }}</div>
          <div>{{ row.memberName }}</div>
          <div>
            <!-- 조회 모드: 상태 뱃지 -->
            <template v-if="!isEditMode">
              <span :class="['status-badge', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
            </template>
            <!-- 수정 모드: 라디오 버튼으로 상태 변경 + 변경 시 localStorage 임시저장 -->
            <template v-else>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.attendId" value="ATTEND"
                    v-model="row.status" @change="saveDraft" /> 출석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.attendId" value="LATE"
                    v-model="row.status" @change="saveDraft" /> 지각
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.attendId" value="ABSENT"
                    v-model="row.status" @change="saveDraft" /> 결석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.attendId" value="EARLY_LEAVE"
                    v-model="row.status" @change="saveDraft" /> 조퇴
                </label>
              </div>
            </template>
          </div>
          <div>
            <!-- 조회 모드: 텍스트, 수정 모드: 입력 필드 -->
            <template v-if="!isEditMode">
              <span class="reason-text">{{ row.reason ?? '-' }}</span>
            </template>
            <input v-else type="text" v-model="row.reason" @input="saveDraft"
              placeholder="사유 입력" class="reason-input" />
          </div>
        </article>
      </DataTable>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import CalendarDate from '@/components/util/CalendarDate.vue'
// [추가] DataTable 컴포넌트 — 강의 목록·출석부 테이블에 공통 사용
import DataTable from '@/components/common/DataTable.vue'

const modal = useModalStore()

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures = ref([])
const isLectureLoading = ref(true)
const selectedLecture = ref(null)

// ── 날짜 필터 ──────────────────────────────────────────────────
const selectedDate = ref(today())

// ── 출석 기록이 있는 날짜 목록 (CalendarDate 연두색 하이라이트용) ──
const recordedDates = ref([])

// ── 출석부 ────────────────────────────────────────────────────
const roster = ref([])
const isRosterLoading = ref(false)

// ── 수정 모드 ─────────────────────────────────────────────────
const isEditMode = ref(false)
const isSaving = ref(false)

// localStorage 키: 강의+날짜 조합으로 해당 날짜의 임시저장 데이터 식별
const ATTEND_KEY = computed(() =>
  `attendance_${selectedLecture.value?.lectureId}_${selectedDate.value}`
)

// localStorage 키: 강의별 마지막 수정 날짜 저장 (재진입 시 해당 날짜로 바로 이동)
const LAST_EDIT_KEY = computed(() =>
  `attendance_last_edit_${selectedLecture.value?.lectureId}`
)

// selectedLecture + selectedDate를 함께 감시 — 두 값이 동시에 바뀌어도 콜백이 한 번만 실행됨
// openRoster 중 suppressWatch 패턴의 레이스 컨디션(double loadRoster 문제) 을 제거하기 위해 통합 watch로 변경
watch([selectedLecture, selectedDate], async ([newLec, newDate], [oldLec]) => {
  if (!newLec) return   // 강의가 선택 해제된 경우 스킵
  isEditMode.value = false

  // 강의가 바뀐 경우에만 달력 하이라이트 날짜 재로딩 (날짜만 바뀔 때는 불필요)
  if (newLec?.lectureId !== oldLec?.lectureId) {
    await loadRecordedDates()
  }
  await loadRoster()
})

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } finally {
    isLectureLoading.value = false
  }
})

// 강의 카드 클릭 → 출석부 뷰로 전환
// watch([selectedLecture, selectedDate])가 변경을 감지해서 loadRoster/loadRecordedDates를 자동 호출
function openRoster(lec) {
  selectedLecture.value = lec
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []

  // 마지막으로 수정 중이던 날짜가 있으면 해당 날짜로 이동, 없으면 오늘
  // selectedLecture + selectedDate 둘 다 동시에 변경되어 watch 콜백이 한 번만 실행됨
  const lastDate = localStorage.getItem(`attendance_last_edit_${lec.lectureId}`)
  selectedDate.value = lastDate ?? today()     // 날짜 먼저 세팅
  selectedLecture.value = lec                  // 강의 마지막 세팅 (이 시점에 watch 발동)
}

// 강의 목록으로 돌아가기
function closeRoster() {
  selectedLecture.value = null
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []
}

// 출석 기록이 있는 날짜 목록 조회 → CalendarDate에 전달하여 연두색 표시
async function loadRecordedDates() {
  if (!selectedLecture.value) return
  try {
    const res = await attendanceService.getRecordedDates(selectedLecture.value.lectureId)
    recordedDates.value = res.data ?? res
  } catch (e) {
    console.error('날짜 목록 조회 실패', e)
  }
}

// 날짜별 출석부 조회 + localStorage 임시저장 복구
async function loadRoster() {
  if (!selectedLecture.value) return
  roster.value = []
  isEditMode.value = false
  isRosterLoading.value = true
  try {
    const res = await attendanceService.getAttendanceList(
      selectedLecture.value.lectureId,
      selectedDate.value,
    )
    const data = res.data ?? res
    console.log('🔍 roster data:', data)
    // localStorage에 임시저장 데이터가 있으면 복구 여부 확인
    const draft = localStorage.getItem(ATTEND_KEY.value)
    if (draft) {
      const isConfirm = await modal.showConfirm('기존에 수정 중이던 내용을 불러오시겠습니까?', 'info')
      if (isConfirm) {
        // 서버 데이터 순서를 유지하면서 임시저장된 status/reason만 덮어씌우기
        const draftList = JSON.parse(draft)
        roster.value = data.map(row => {
          const saved = draftList.find(d => d.attendId === row.attendId)
          return saved ? { ...row, status: saved.status, reason: saved.reason } : row
        })
        isEditMode.value = true   // 임시저장 복구 시 바로 수정 모드로 진입
      } else {
        // 취소 → 임시저장 삭제 후 서버 원본 데이터 사용
        localStorage.removeItem(ATTEND_KEY.value)
        localStorage.removeItem(LAST_EDIT_KEY.value)
        roster.value = data
      }
    } else {
      roster.value = data
    }
  } catch (e) {
    // httpRequester 인터셉터가 에러 모달을 표시하지만, 추가로 콘솔에 기록해 디버깅을 돕는다
    // 오류 발생 시 roster는 [] 상태를 유지해 "출석 기록 없음" 메시지를 표시
    console.error('[loadRoster] 출석부 조회 실패:', e?.response?.data ?? e)
  } finally {
    isRosterLoading.value = false
  }
}

// 현재 roster 상태를 localStorage에 임시저장 (라디오/사유 변경 시마다 호출)
function saveDraft() {
  localStorage.setItem(ATTEND_KEY.value, JSON.stringify(roster.value))
  // 마지막 수정 날짜 저장 → 재진입 시 해당 날짜로 자동 이동
  localStorage.setItem(LAST_EDIT_KEY.value, selectedDate.value)
}

// 수정 취소: 임시저장 삭제 + 서버 원본 재조회
async function cancelEditMode() {
  localStorage.removeItem(ATTEND_KEY.value)
  localStorage.removeItem(LAST_EDIT_KEY.value)
  isEditMode.value = false
  await loadRoster()
}

// 출석 상태 일괄 저장 (ATTD-06: PATCH /{lectureId})
async function saveAttendance() {
  const confirm = await modal.showConfirm(`${selectedDate.value} 출석 정보를 저장하시겠습니까?`, 'info')
  if (!confirm) return

  isSaving.value = true
  try {
    // attendId가 null인 항목(미처리)은 제외하고 실제 출석 기록만 수정 요청
    const updates = roster.value
      .filter(row => row.attendId !== null)
      .map(row => ({
        attendId: row.attendId,
        status: row.status,
        reason: row.reason || null,
      }))
    await attendanceService.updateAttendStatuses(selectedLecture.value.lectureId, updates)

    // 저장 성공 → 임시저장 삭제 + 서버 데이터 재조회 + 달력 하이라이트 갱신
    localStorage.removeItem(ATTEND_KEY.value)
    localStorage.removeItem(LAST_EDIT_KEY.value)
    await loadRoster()
    await loadRecordedDates()
    await modal.showAlert(`${selectedDate.value} 출석 정보가 저장되었습니다.`, 'success')
    isEditMode.value = false
  } catch (e) {
    console.error('저장 실패', e)
    await modal.showAlert('출석 저장에 실패했습니다.', 'error')
  } finally {
    isSaving.value = false
  }
}

// ── 유틸 ──────────────────────────────────────────────────────
function today() {
  const d = new Date()
  // toISOString()은 UTC 기준이라 KST 새벽 0~9시에는 날짜가 1일 어긋남 → 로컬 날짜 사용
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function statusLabel(code) {
  return { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }[code] ?? code
}

function statusClass(status) {
  return { ATTEND: 'attend', ABSENT: 'absent', LATE: 'late', EARLY_LEAVE: 'early-leave' }[status] ?? ''
}
</script>

<style scoped lang="scss">
/* [수정] 전체 스타일을 1차 프로젝트 공통 스타일(_layout.scss)과 통일 */
.attendance-list-page {
  width: 100%;
  padding: 28px var(--size-df);
  overflow-x: auto;
}

.page-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--font-color);
}

/* 강의 유형 뱃지 — position: static으로 전역 .tbl-wrap .status-badge 절대위치 규칙 차단 */
.type-badge {
  position: static;
  display: inline-block;
  background: var(--main-color);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

/* View 1: 강의 목록 행 — 클릭 커서 표시 */
.lecture-row { cursor: pointer; }

/* 강의실 셀 — 복수 스케줄 줄바꿈, 각 항목은 nowrap */
.schedule-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}
.schedule-item { font-size: var(--text-sm); white-space: nowrap; }

/* ── View 2: 출석부 헤더 ── */
.roster-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: 1px solid var(--line-color);
  border-radius: var(--bdrs-sm);
  padding: 7px 14px;
  font-size: var(--text-sm);
  cursor: pointer;
  color: var(--font-color-light);
  white-space: nowrap;
  &:hover { background: var(--default-hover-bg-color); }
}

.lecture-title {
  display: flex;
  align-items: center;
  gap: 10px;
  h2 { font-size: var(--text-xl); font-weight: 700; color: var(--font-color); margin: 0; }
}

/* ── 날짜 필터 바 ── */
.date-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-label { font-size: var(--text-sm); color: var(--font-color); font-weight: 600; }
.action-btns { display: flex; gap: 8px; margin-left: 8px; }
.no-session-msg { font-size: var(--text-sm); color: #f57c00; }

/* ── 출결 상태 뱃지 ── */
.status-badge {
  // [수정] _layout.scss의 .tbl-wrap .status-badge { position: absolute } 전역 규칙 재정의
  // 해당 규칙이 DataTable 안에서 뱃지를 셀 위에 절대위치로 띄우는 버그 수정
  position: static;
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: var(--text-xs);
  font-weight: 700;
  &.attend      { background: #e6f9ee; color: #2e7d32; }
  &.absent      { background: #fdecea; color: #c62828; }
  &.late        { background: #fff8e1; color: #f57f17; }
  &.early-leave { background: #fff3e0; color: #e65100; }
}

.reason-text { font-size: var(--text-sm); color: var(--font-color-light); }

/* ── 수정 모드 라디오 버튼 ── */
.radio-group { display: flex; gap: 14px; font-size: var(--text-sm); flex-wrap: wrap; }
.radio-label {
  // [수정] 전역 .radio-label의 padding-left: 15px(커스텀 원 공간) 유지하되 flex 레이아웃 재정의
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.radio-label:nth-of-type(1):has(input[type='radio']:checked) { color: #2e7d32; }
.radio-label:nth-of-type(2):has(input[type='radio']:checked) { color: #f57f17; }
.radio-label:nth-of-type(3):has(input[type='radio']:checked) { color: #c62828; }
.radio-label:nth-of-type(4):has(input[type='radio']:checked) { color: #e65100; }

.reason-input {
  padding: 5px 8px;
  border: 1px solid var(--line-color);
  border-radius: 4px;
  font-size: var(--text-sm);
  width: 140px;
  &:focus { border-color: var(--main-color); outline: none; }
}

/* ── 공통 버튼 ── */
.btn {
  padding: 6px 14px;
  border: none;
  border-radius: 5px;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.btn-edit-mode   { background: var(--default-hover-bg-color); color: var(--font-color); border: 1px solid var(--line-color); &:hover { background: #e0e0e0; } }
  &.btn-save        { background: var(--main-color); color: #fff; border: 1px solid var(--main-color); &:hover { filter: brightness(1.1); } }
  &.btn-cancel-edit { background: #fff; border: 1px solid var(--line-color); color: var(--font-color-light); &:hover { background: var(--default-hover-bg-color); } }
}

/* DataTable 슬롯 .tbl-row 공통 — 강의 목록 + 출석부 둘 다 적용 */
/* DataTable 컴포넌트의 scoped CSS는 slot 내부 div에 적용되지 않으므로 직접 정의 */
.tbl-row {
  display: grid;
  grid-template-columns: var(--grid-cols);
  align-items: stretch;
  background: #fff;
  border: 1px solid var(--table-border-color);
  border-top-width: 0;

  &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
  &:last-child     { border-radius: 0 0 5px 5px; }

  // 모든 셀: 패딩 + 세로 가로 중앙 정렬
  > div {
    padding: 12px 10px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// 강의실·출결상태 셀처럼 내용이 여러 줄이거나 좌측 정렬이 필요한 셀은 재정의
.schedule-cell  { justify-content: flex-start !important; }
.action-cell    { justify-content: center; gap: 6px; }
.radio-group    { justify-content: flex-start; flex-wrap: wrap; }

/* View 1: 강의 목록 행만 hover + 클릭 커서 */
.lecture-row {
  cursor: pointer;
  &:hover { background: var(--hover-bg-color); color: #111; z-index: 2; }
}
</style>