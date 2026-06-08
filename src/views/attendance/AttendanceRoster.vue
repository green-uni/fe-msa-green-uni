<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useModalStore } from '@/stores/modal'
import attendanceService from '@/services/attendanceService.js'
import CalendarDate from '@/components/util/CalendarDate.vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Pagination from '@/components/common/Pagination.vue'

const route  = useRoute()
const router = useRouter()
const modal  = useModalStore()

const lectureId = route.params.lectureId

// ── 강의 정보 ──────────────────────────────────────────────────
const lecture   = ref(null)
const isLoading = ref(true)

// 현재 학기 강의만 출석 수정 가능
const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2
const isCurrentLecture = computed(() =>
  lecture.value?.year === currentYear && lecture.value?.semester === currentSemester
)

// 강의실 헬퍼 — 출석 서비스 schedules는 s.lectureRoom 필드 사용 (강의 서비스와 다름)
const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join(', ')
}

// ── 날짜 필터 ──────────────────────────────────────────────────
const selectedDate  = ref(today())
const recordedDates = ref([])
const cancelledDates = ref([])

const isSelectedDateCancelled = computed(() =>
  cancelledDates.value.includes(selectedDate.value)
)

// ── 출석부 ────────────────────────────────────────────────────
const roster          = ref([])
const isRosterLoading = ref(false)
const isEditMode      = ref(false)
const isSaving        = ref(false)

// ── 페이징 ────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

const totalPages  = computed(() => Math.ceil(roster.value.length / PAGE_SIZE))
const pagedRoster = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return roster.value.slice(start, start + PAGE_SIZE)
})

const ATTEND_KEY    = computed(() => `attendance_${lectureId}_${selectedDate.value}`)
const LAST_EDIT_KEY = `attendance_last_edit_${lectureId}`

// ── 출석 상태 ─────────────────────────────────────────────────
const STATUS_LABEL = { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }
const STATUS_CLASS = { ATTEND: 'text-attend', ABSENT: 'text-absent', LATE: 'text-late', EARLY_LEAVE: 'text-early-leave' }

const statusLabel = (code) => STATUS_LABEL[code] ?? code
const statusClass = (code) => STATUS_CLASS[code] ?? ''

// ── watch: onMounted 초기화 완료 후에만 활성화 ────────────────
// onMounted에서 selectedDate를 바꿀 때 watch가 중복으로 loadRoster를 호출하는 것을 방지
let _initDone = false
watch(selectedDate, async () => {
  if (!_initDone) return
  isEditMode.value = false
  await loadRoster()
})

onMounted(async () => {
  // 강의 정보 조회
  try {
    const res = await attendanceService.getProfessorLecture(lectureId)
    lecture.value = res.data ?? res
  } catch {
    // 조회 실패 시 라우터 state 폴백
    lecture.value = { lectureName: history.state?.lectureName ?? '' }
  } finally {
    isLoading.value = false
  }

  // 마지막 편집 날짜 복원
  const lastDate = localStorage.getItem(LAST_EDIT_KEY)
  if (lastDate) selectedDate.value = lastDate

  await Promise.all([loadRecordedDates(), loadCancelledDates()])
  await loadRoster()
  _initDone = true  // 이후 selectedDate 변경은 watch가 처리
})

async function loadRecordedDates() {
  try {
    const res = await attendanceService.getRecordedDates(lectureId)
    recordedDates.value = res.data ?? res
  } catch (e) {
    console.error('날짜 목록 조회 실패', e)
  }
}

async function loadCancelledDates() {
  try {
    const res = await attendanceService.getCancelledDates(lectureId)
    const list = res.data ?? res
    cancelledDates.value = list.map(item => item.cancelDate)
  } catch (e) {
    console.error('휴강 날짜 조회 실패', e)
  }
}

async function loadRoster() {
  roster.value = []
  isEditMode.value = false
  isRosterLoading.value = true
  currentPage.value = 1
  try {
    const res = await attendanceService.getAttendanceList(lectureId, selectedDate.value)
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
        localStorage.removeItem(LAST_EDIT_KEY)
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
  localStorage.setItem(LAST_EDIT_KEY, selectedDate.value)
}

async function cancelEditMode() {
  localStorage.removeItem(ATTEND_KEY.value)
  localStorage.removeItem(LAST_EDIT_KEY)
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
    await attendanceService.updateAttendStatuses(lectureId, updates)
    localStorage.removeItem(ATTEND_KEY.value)
    localStorage.removeItem(LAST_EDIT_KEY)
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
  <div class="attendance-roster-page">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <!-- 강의 정보 카드 -->
    <div class="card" v-if="lecture">
      <div class="card-label">{{ lecture.lectureName }}</div>
      <div class="info-grid lecture-info-grid">
        <div class="info-item">
          <span class="info-key">학점</span>
          <span class="info-val">{{ lecture.credit ?? '-' }}학점</span>
        </div>
        <div class="info-item">
          <span class="info-key">대상학년</span>
          <span class="info-val">{{ lecture.academicYear ?? '-' }}학년</span>
        </div>
        <div class="info-item">
          <span class="info-key">강의일정</span>
          <span class="info-val schedule-val">{{ scheduleText(lecture.schedules) }}</span>
        </div>
      </div>
    </div>

    <!-- 날짜 선택 -->
    <div class="date-bar">
      <span class="date-label">수업 날짜</span>
      <CalendarDate v-model="selectedDate" :highlightedDates="recordedDates" :cancelledDates="cancelledDates" />
    </div>

    <!-- 휴강 날짜 안내 -->
    <div v-if="isSelectedDateCancelled" class="cancel-notice">
      <p>해당 요일은 휴강처리 되었습니다.</p>
    </div>

    <!-- 출석부 테이블 -->
    <DataTable v-if="!isSelectedDateCancelled"
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
          <template v-if="!isEditMode">
            <span class="no-data">{{ row.reason ?? '-' }}</span>
          </template>
          <input v-else type="text" v-model="row.reason" @input="saveDraft"
            placeholder="사유 입력" class="tbl-input" />
        </div>
      </article>
    </DataTable>

    <!-- 하단 버튼 -->
    <div class="page-footer">
      <button class="btn btn-default" @click="router.push('/attendances/roster')"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
      <div class="action-group" v-if="roster.length > 0 && !isSelectedDateCancelled">
        <button v-if="!isEditMode && isCurrentLecture" class="btn btn-default" @click="isEditMode = true">수정</button>
        <template v-else>
          <button class="btn btn-default" @click="cancelEditMode">취소</button>
          <button class="btn btn-submit" :disabled="isSaving" @click="saveAttendance"><font-awesome-icon icon="fa-solid fa-circle-check" /> 저장</button>
        </template>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="roster-footer" v-if="roster.length > 0 && !isSelectedDateCancelled">
      <Pagination v-if="totalPages > 1"
        :currentPage="currentPage" :maxPage="totalPages" :pageGroupSize="10"
        @goToPage="goToPage" />
      <p class="roster-count">
        총 {{ roster.length }}명 중
        {{ (currentPage - 1) * PAGE_SIZE + 1 }}~{{ Math.min(currentPage * PAGE_SIZE, roster.length) }}명 표시
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.attendance-roster-page {
  width: 100%;
  padding: 28px $size-df;
  overflow: visible;
  position: relative;
}

/* 강의 정보 카드 — 학점 · 대상학년 · 강의일정 한 줄 균일 간격 */
.lecture-info-grid {
  display: flex;
  gap: 28px;
  align-items: baseline;

  .info-item { flex-shrink: 0; }

  :deep(.info-item) { gap: 20px !important; }
  :deep(.info-key)  { width: auto !important; }
}

.schedule-val { white-space: nowrap; }

/* 달력 팝업이 테이블 뒤로 숨지 않도록 z-index 확보 */
.date-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
  z-index: 50;
  :deep(.calendar-input-wrap) { width: auto; }
}
.date-label { font-size: $fs-xs; font-weight: 600; white-space: nowrap; }

/* 휴강 안내 */
.cancel-notice {
  background: #fff3e0;
  border: 1px solid #e65100;
  border-radius: $radius-sm;
  padding: 24px;
  text-align: center;
  color: #e65100;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: $md;
}

.roster-table {
  display: flex;
  flex-direction: column;
  :deep(.tbl-wrap) { overflow: visible !important; }
}

/* 수정 모드 라디오 — 전역 _form.scss radio-label과 충돌하여 scoped 유지 */
.radio-group { display: flex; gap: 14px; font-size: $fs-xs; flex-wrap: wrap; justify-content: center; }
.radio-label {
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  padding-left: 0;
  input[type='radio'] { display: inline-block; width: 14px; height: 14px; accent-color: $green-600; }
  &:nth-of-type(1):has(input:checked) { color: $green-600; }
  &:nth-of-type(2):has(input:checked) { color: #f57f17; }
  &:nth-of-type(3):has(input:checked) { color: #d32f2f; }
  &:nth-of-type(4):has(input:checked) { color: #e65100; }
}

/* 페이지네이션 + 인원 수 */
.roster-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}
.roster-count {
  margin-top: 8px;
  font-size: $fs-xs;
  color: $font-color-light;
}
</style>
