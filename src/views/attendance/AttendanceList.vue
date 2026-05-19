<template>
  <div class="attendance-list-page">

    <!-- ── View 1: 강의 목록 (DataTable) ───────────────────────── -->
    <template v-if="!selectedLecture">
      <div class="filter-header">
        <h2 class="page-title">출석 현황</h2>
      </div>

      <!-- [수정] 고정 높이 확보를 위한 클래스 추가 -->
      <DataTable
        :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
        :rows="lectures"
        gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
        :isLoading="isLectureLoading"
        emptyMessage="담당 강의가 없습니다."
        class="lecture-table"
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
        <div class="date-picker-wrap">
          <label class="date-label">수업 날짜</label>
          <CalendarDate v-model="selectedDate" :highlightedDates="recordedDates" />
        </div>
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

      <!-- [수정] 고정 높이 확보를 위한 클래스 추가 -->
      <DataTable
        :columns="['학년', '학과', '이름', '출결 상태', '비고']"
        :rows="roster"
        gridCols="0.8fr 1.8fr 1fr 2.5fr 2fr"
        :isLoading="isRosterLoading"
        emptyMessage="선택한 날짜에 출석 기록이 없습니다."
        class="roster-table"
      >
        <!-- [수정] :name 속성을 고유한 studentCode 조합으로 변경하여 결석 처리가 겹치는 버그 방지 -->
        <article v-for="row in pagedRoster" :key="row.studentCode" class="tbl-row">
          <div>{{ row.academic_year != null ? row.academic_year + '학년' : '-' }}</div>
          <div>{{ row.major_name ?? '-' }}</div>
          <div>{{ row.memberName }}</div>
          <div>
            <!-- 조회 모드: 상태 뱃지 -->
            <template v-if="!isEditMode">
              <span :class="['status-badge', statusClass(row.status)]">{{ statusLabel(row.status) }}</span>
            </template>
            <!-- 수정 모드: 라디오 버튼으로 상태 변경 -->
            <template v-else>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="ATTEND"
                    v-model="row.status" @change="saveDraft" /> 출석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="LATE"
                    v-model="row.status" @change="saveDraft" /> 지각
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="ABSENT"
                    v-model="row.status" @change="saveDraft" /> 결석
                </label>
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="EARLY_LEAVE"
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

      <!-- 하단 정보 구조 레이아웃 감싸기 -->
      <div class="roster-footer">
        <!-- 페이지네이션: 10명 초과 시만 표시 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">&#8249;</button>
          <button
            v-for="p in totalPages"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">&#8250;</button>
        </div>
        <p v-if="roster.length > 0" class="roster-count">
          총 {{ roster.length }}명 중 {{ (currentPage - 1) * PAGE_SIZE + 1 }}~{{ Math.min(currentPage * PAGE_SIZE, roster.length) }}명 표시
        </p>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import CalendarDate from '@/components/util/CalendarDate.vue'
import DataTable from '@/components/common/DataTable.vue'

const modal = useModalStore()

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures = ref([])
const isLectureLoading = ref(true)
const selectedLecture = ref(null)

// ── 날짜 필터 ──────────────────────────────────────────────────
const selectedDate = ref(today())

// ── 출석 기록이 있는 날짜 목록 ──
const recordedDates = ref([])

// ── 출석부 ────────────────────────────────────────────────────
const roster = ref([])
const isRosterLoading = ref(false)

// ── 수정 모드 ─────────────────────────────────────────────────
const isEditMode = ref(false)
const isSaving = ref(false)

// ── 페이징 ────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(roster.value.length / PAGE_SIZE))

const pagedRoster = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return roster.value.slice(start, start + PAGE_SIZE)
})

const ATTEND_KEY = computed(() =>
  `attendance_${selectedLecture.value?.lectureId}_${selectedDate.value}`
)

const LAST_EDIT_KEY = computed(() =>
  `attendance_last_edit_${selectedLecture.value?.lectureId}`
)

watch([selectedLecture, selectedDate], async ([newLec, newDate], [oldLec]) => {
  if (!newLec) return
  isEditMode.value = false

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

function openRoster(lec) {
  selectedLecture.value = lec
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []

  const lastDate = localStorage.getItem(`attendance_last_edit_${lec.lectureId}`)
  selectedDate.value = lastDate ?? today()
  selectedLecture.value = lec
}

function closeRoster() {
  selectedLecture.value = null
  isEditMode.value = false
  roster.value = []
  recordedDates.value = []
}

async function loadRecordedDates() {
  if (!selectedLecture.value) return
  try {
    const res = await attendanceService.getRecordedDates(selectedLecture.value.lectureId)
    recordedDates.value = res.data ?? res
  } catch (e) {
    console.error('날짜 목록 조회 실패', e)
  }
}

async function loadRoster() {
  if (!selectedLecture.value) return
  roster.value = []
  isEditMode.value = false
  isRosterLoading.value = true
  currentPage.value = 1
  try {
    const res = await attendanceService.getAttendanceList(
      selectedLecture.value.lectureId,
      selectedDate.value,
    )
    const data = res.data ?? res
    console.log('🔍 roster data:', data)

    const draft = localStorage.getItem(ATTEND_KEY.value)
    if (draft) {
      const isConfirm = await modal.showConfirm('기존에 수정 중이던 내용을 불러오시겠습니까?', 'info')
      if (isConfirm) {
        const draftList = JSON.parse(draft)
        roster.value = data.map(row => {
          const saved = draftList.find(d => d.studentCode === row.studentCode)
          return saved ? { ...row, status: saved.status, reason: saved.reason } : row
        })
        isEditMode.value = true
      } else {
        localStorage.removeItem(ATTEND_KEY.value)
        localStorage.removeItem(LAST_EDIT_KEY.value)
        roster.value = data
      }
    } else {
      roster.value = data
    }
  } catch (e) {
    console.error('[loadRoster] 출석부 조회 실패:', e?.response?.data ?? e)
  } finally {
    isRosterLoading.value = false
  }
}

function saveDraft() {
  localStorage.setItem(ATTEND_KEY.value, JSON.stringify(roster.value))
  localStorage.setItem(LAST_EDIT_KEY.value, selectedDate.value)
}

async function cancelEditMode() {
  localStorage.removeItem(ATTEND_KEY.value)
  localStorage.removeItem(LAST_EDIT_KEY.value)
  isEditMode.value = false
  await loadRoster()
}

async function saveAttendance() {
  const confirm = await modal.showConfirm(`${selectedDate.value} 출석 정보를 저장하시겠습니까?`, 'info')
  if (!confirm) return

  isSaving.value = true
  try {
    const updates = roster.value
      .filter(row => row.attendId !== null)
      .map(row => ({
        attendId: row.attendId,
        status: row.status,
        reason: row.reason || null,
      }))
    await attendanceService.updateAttendStatuses(selectedLecture.value.lectureId, updates)

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

function today() {
  const d = new Date()
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
.attendance-list-page {
  width: 100%;
  padding: 28px var(--size-df);
  /* [수정] 부모 컨테이너가 자식 달력 요소의 absolute 팝업을 가두지 않도록 수정 */
  overflow: visible;
  position: relative;
}

.page-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--font-color);
  margin-bottom: 20px;
}

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

.lecture-row { cursor: pointer; }

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
  /* [수정] 달력 팝업 드롭다운이 아래 테이블 뒤로 숨지 않도록 레이어 순서 지정 */
  position: relative;
  z-index: 50;
}

.date-picker-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.date-label { font-size: var(--text-sm); color: var(--font-color); font-weight: 600; }
.action-btns { display: flex; gap: 8px; margin-left: 8px; }
.no-session-msg { font-size: var(--text-sm); color: #f57c00; }

/* ── [수정] 테이블 최소 높이 고정 ── */
.lecture-table,
.roster-table {
  /* 인원이 적거나 없어도 하단 컴포넌트가 위로 올라오지 않도록 고정 높이 확보 */
  min-height: 460px;
  background-color: #fff;
  display: flex;
  flex-direction: column;

  :deep(.tbl-wrap) {
    overflow: visible !important;
  }
}

/* 데이터 없을 때 빈 영역도 충분한 높이 유지 */
.roster-table :deep(.empty-message),
.roster-table :deep(.no-data),
.lecture-table :deep(.empty-message) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: var(--font-color-light);
  font-size: var(--text-sm);
}

/* ── 출결 상태 뱃지 ── */
.status-badge {
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

/* DataTable 슬롯 행 공통 */
.tbl-row {
  display: grid;
  grid-template-columns: var(--grid-cols);
  align-items: stretch;
  background: #fff;
  border: 1px solid var(--table-border-color);
  border-top-width: 0;

  &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
  &:last-child     { border-radius: 0 0 5px 5px; }

  > div {
    padding: 12px 10px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.schedule-cell  { justify-content: flex-start !important; }
.action-cell    { justify-content: center; gap: 6px; }
.radio-group    { justify-content: flex-start; flex-wrap: wrap; }

.lecture-row {
  cursor: pointer;
  &:hover { background: var(--hover-bg-color); color: #111; z-index: 2; }
}

/* ── 하단 푸터 (페이지네이션 + 카운트) ── */
.roster-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line-color);
  border-radius: 6px;
  background: #fff;
  color: var(--font-color);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) { background: var(--hover-bg-color); border-color: var(--main-color); color: var(--main-color); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &.active { background: var(--main-color); color: #fff; border-color: var(--main-color); }
}

.roster-count {
  text-align: center;
  margin-top: 8px;
  font-size: var(--text-xs);
  color: var(--font-color-light);
}
</style>