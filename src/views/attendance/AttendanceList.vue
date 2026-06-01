<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import CalendarDate from '@/components/util/CalendarDate.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Pagination from '@/components/common/Pagination.vue'

const modal = useModalStore()

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures         = ref([])
const isLectureLoading = ref(true)
const selectedLecture  = ref(null)

// ── 날짜 필터 ──────────────────────────────────────────────────
const selectedDate   = ref(today())
const recordedDates  = ref([])

// ── 출석부 ────────────────────────────────────────────────────
const roster          = ref([])
const isRosterLoading = ref(false)
const isEditMode      = ref(false)
const isSaving        = ref(false)

// ── 페이징 ────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(roster.value.length / PAGE_SIZE))

const pagedRoster = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return roster.value.slice(start, start + PAGE_SIZE)
})

const ATTEND_KEY   = computed(() => `attendance_${selectedLecture.value?.lectureId}_${selectedDate.value}`)
const LAST_EDIT_KEY = computed(() => `attendance_last_edit_${selectedLecture.value?.lectureId}`)

// ── 강의 유형 / 강의실 헬퍼 ───────────────────────────────────
const LECTURE_TYPE = {
  GENERAL_REQUIRED: '교양필수', GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',   MAJOR_ELECTIVE: '전공선택',
}
const typeLabel = (code) => LECTURE_TYPE[code] ?? code

const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join('\n')
}

// ── 현재 학기 판별 ────────────────────────────────────────────
const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2
const isCurrent       = (lec) => lec.year === currentYear && lec.semester === currentSemester

// ── 출석 상태 ─────────────────────────────────────────────────
const STATUS_LABEL = { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }
const STATUS_CLASS = { ATTEND: 'text-attend', ABSENT: 'text-absent', LATE: 'text-late', EARLY_LEAVE: 'text-early-leave' }

const statusLabel = (code) => STATUS_LABEL[code] ?? code
const statusClass = (code) => STATUS_CLASS[code] ?? ''

// ── 로직 ──────────────────────────────────────────────────────
watch([selectedLecture, selectedDate], async ([newLec, newDate], [oldLec]) => {
  if (!newLec) return
  isEditMode.value = false
  if (newLec?.lectureId !== oldLec?.lectureId) await loadRecordedDates()
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
    const res = await attendanceService.getAttendanceList(selectedLecture.value.lectureId, selectedDate.value)
    const data = res.data ?? res
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
      .map(row => ({ attendId: row.attendId, status: row.status, reason: row.reason || null }))
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

const goToPage = (page) => { currentPage.value = page }

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="attendance-list-page">
    <!-- ── View 1: 강의 목록 ────────────────────────────────── -->
    <template v-if="!selectedLecture">
      <LoadingSpinner v-if="isLectureLoading" :overlay="true" size="md" />

    <div class="list-header">
      <div class="list-header-box">
        <p>현재 학기 <strong>{{ currentYear }}</strong>년 <strong>{{ currentSemester }}</strong>학기</p>
      </div>
    </div>

      <DataTable
        :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
        :rows="lectures"
        gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
        :isLoading="isLectureLoading"
        emptyMessage="담당 강의가 없습니다.">
        <article
          v-for="lec in lectures"
          :key="lec.lectureId"
          class="tbl-row pointer"
          :class="{ 'row--sample': !isCurrent(lec) }"
          @click="openRoster(lec)">
          <div class="tal">{{ lec.lectureName }}</div>
          <div>{{ typeLabel(lec.lectureType) }}</div>
          <div>{{ lec.year }}년 {{ lec.semester }}학기</div>
          <div>{{ lec.credit }}학점 / {{ lec.academicYear }}학년</div>
          <div class="tal pre-line">{{ scheduleText(lec.schedules) }}</div>
        </article>
      </DataTable>
    </template>

    <!-- ── View 2: 출석부 ─────────────────────────────────── -->
    <template v-else>

      <!-- 강의 정보 카드 -->
      <div class="card">
        <div class="card-label">{{ selectedLecture.lectureName }}</div>
        <div class="info-grid lecture-card-grid">
          <div class="info-item">
            <span class="info-key">학점</span>
            <span class="info-val">{{ selectedLecture.credit }}학점</span>
          </div>
          <div class="info-item">
            <span class="info-key">대상학년</span>
            <span class="info-val">{{ selectedLecture.academicYear }}학년</span>
          </div>
          <div class="info-item">
            <span class="info-key">학년도</span>
            <span class="info-val">{{ selectedLecture.year }}년</span>
          </div>
          <div class="info-item">
            <span class="info-key">학기</span>
            <span class="info-val">{{ selectedLecture.semester }}학기</span>
          </div>
          <div class="info-item g-col-full">
            <span class="info-key">강의일정</span>
            <span class="info-val pre-line">{{ scheduleText(selectedLecture.schedules) }}</span>
          </div>
        </div>
      </div>

      <!-- 날짜 선택 -->
      <div class="date-bar">
        <span>수업 날짜</span>
        <CalendarDate v-model="selectedDate" :highlightedDates="recordedDates" />
      </div>

      <!-- 출석부 테이블 -->
      <DataTable
        :columns="['학년', '학과', '이름', '출결 상태', '비고']"
        :rows="roster"
        gridCols="0.8fr 1.8fr 1fr 2.5fr 2fr"
        :isLoading="isRosterLoading"
        emptyMessage="선택한 날짜에 출석 기록이 없습니다."
        class="roster-table">
        <article v-for="row in pagedRoster" :key="row.studentCode" class="tbl-row">
          <div>{{ row.academic_year != null ? row.academic_year + '학년' : '-' }}</div>
          <div>{{ row.major_name ?? '-' }}</div>
          <div>{{ row.memberName }}</div>
          <div>
            <template v-if="!isEditMode">
              <span :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
            </template>
            <template v-else>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" :name="'status-' + row.studentCode" value="ATTEND"
                    v-model="row.status" @change="saveDraft" /> 출석
                </label>
                <label class="radio-label late">
                  <input type="radio" :name="'status-' + row.studentCode" value="LATE"
                    v-model="row.status" @change="saveDraft" /> 지각
                </label>
                <label class="radio-label absent">
                  <input type="radio" :name="'status-' + row.studentCode" value="ABSENT"
                    v-model="row.status" @change="saveDraft" /> 결석
                </label>
                <label class="radio-label early-leave">
                  <input type="radio" :name="'status-' + row.studentCode" value="EARLY_LEAVE"
                    v-model="row.status" @change="saveDraft" /> 조퇴
                </label>
              </div>
            </template>
          </div>
          <div>
            <template v-if="!isEditMode">
              <span class="no-data">{{ row.reason ?? '-' }}</span>
            </template>
            <input v-else type="text" v-model="row.reason" @input="saveDraft"
              placeholder="사유 입력" class="tbl-input" />
          </div>
        </article>
      </DataTable>

      <!-- 페이지네이션 -->
      <div v-if="roster.length > 0">
        <Pagination v-if="totalPages > 1"
          :currentPage="currentPage" :maxPage="totalPages" :pageGroupSize="10"
          @goToPage="goToPage" />
        <p class="roster-count">
          총 {{ roster.length }}명 중
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}~{{ Math.min(currentPage * PAGE_SIZE, roster.length) }}명 표시
        </p>
      </div>

      <!-- 하단 버튼 -->
      <div class="page-footer">
        <button class="btn btn-default" @click="closeRoster">← 강의 목록</button>
        <div class="action-group" v-if="roster.length > 0">
          <button v-if="!isEditMode" class="btn btn-default" @click="isEditMode = true">수정</button>
          <template v-else>
            <button class="btn btn-default" @click="cancelEditMode">취소</button>
            <button class="btn btn-submit" :disabled="isSaving" @click="saveAttendance">저장</button>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped lang="scss">
/* 달력 팝업이 테이블 뒤로 숨지 않도록 */
.date-bar {
  display: flex; align-items: center; gap: 12px; margin-bottom: $md; position: relative;  z-index: 50;padding-left: $xs;
  span{font-weight: bold;}
  /* CalendarDate 내부 width: 100% 가 flex 폭을 전부 차지해 버튼이 우측 끝으로 밀리는 것 방지 */
  :deep(.calendar-input-wrap) { width: auto; }
}

/* 강의 정보 카드 info-grid — 2컬럼, 강의일정은 g-col-full로 전체 폭 */
.lecture-card-grid { grid-template-columns: 1fr 1fr 1fr 1fr; }

/* overflow: visible — 달력 팝업이 테이블 내부 overflow에 잘리지 않도록 */
.roster-table {
  display: flex;
  flex-direction: column;
  :deep(.tbl-wrap) { overflow: visible !important; }
}

/* 수정 모드 라디오 — 전역 radio-group 사용, 테이블 셀 내 크기만 override */
.radio-group { font-size: $fs-xs; flex-wrap: wrap; }
/* 출석 상태별 선택 시 텍스트 색상 — modifier 클래스 기반 */
.radio-label {
  &:has(input:checked)             { color: $green-600; }
  &.late:has(input:checked)        { color: #f57f17; }
  &.absent:has(input:checked)      { color: #d32f2f; }
  &.early-leave:has(input:checked) { color: #e65100; }
}

.roster-count {  margin-top:$md; font-size: $fs-xs; color: $font-color-light; text-align: center;}
</style>
