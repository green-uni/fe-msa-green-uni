<script setup>
import { ref, computed, nextTick } from 'vue'
import { onClickOutside } from '@vueuse/core'
import FullCalendar from '@fullcalendar/vue3'
import dayGridMonth from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ScheduleService from '@/services/scheduleService' // ===== scheduleService =====
import { useAuthStore } from '@/stores/authentication' // ===== pinia store =====
import { useModalStore } from '@/stores/modal'

// ===== 권한 확인 =====
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.role === 'ADMIN')
const modal = useModalStore()

// ===== 데이터 =====
const events = ref([])

// ===== 상태 관리 =====
const fullCalendar = ref(null)
const isYearView = ref(false)
const selectedEventId = ref(null)
const showAddForm = ref(false)
const showEditForm = ref(false)

// ===== 폼 데이터 =====
const newEvent = ref({ type: '', title: '', startDate: '', endDate: '' })
const editEvent = ref({ id: '', type: '', title: '', startDate: '', endDate: '' })

// ===== 현재 표시 중인 년/월 (네비게이션용) =====
const currentYear = ref(2026)
const currentMonth = ref(5)

// ===== 일정 구분 타입 목록 (bg: 연한 배경 / fg: 진한 글자 / bar: 왼쪽 바) =====
const scheduleTypes = [
  { code: 'COURSE_REGISTRATION',  value: '수강신청',     bg: '#f7e9ea', fg: '#9c4348', bar: '#c1666b' },
  { code: 'COURSE_MODIFICATION',  value: '수강정정',     bg: '#f6eaea', fg: '#8a4444', bar: '#b06a6a' },
  { code: 'LECTURE_REGISTRATION', value: '강의개설신청', bg: '#f8efe1', fg: '#945c1f', bar: '#c4862f' },
  { code: 'GRADE_INPUT',          value: '성적입력',     bg: '#edeaf4', fg: '#524179', bar: '#7565a0' },
  { code: 'GRADE_VIEW',           value: '성적조회',     bg: '#eceef3', fg: '#475a86', bar: '#6b7ba8' },
  { code: 'GRADE_APPEAL',         value: '성적이의신청', bg: '#e7edf5', fg: '#3a5478', bar: '#5e7aa6' },
  { code: 'LECTURE_EVALUATION',   value: '강의평가',     bg: '#f1efe6', fg: '#6f6749', bar: '#9e9474' },
  { code: 'TUITION_PAYMENT',      value: '등록금납부',   bg: '#f6e7e9', fg: '#8a3a46', bar: '#b85767' },
  { code: 'MAJOR_CHANGE',         value: '전공변경신청', bg: '#e6eefb', fg: '#2c5fac', bar: '#4a82d6' },
  { code: 'SEMESTER_START',       value: '학기시작',     bg: '#efece2', fg: '#7a6420', bar: '#b39636' },
  { code: 'ETC',                  value: '기타',         bg: '#eaedf0', fg: '#3c4856', bar: '#64748b' },
]

// ===== 현재 월 일정만 필터링 (시작일 오름차순) =====
const currentMonthEvents = computed(() => {
  return events.value
    .filter(event => {
      const month = new Date(event.start).getMonth() + 1
      const year = new Date(event.start).getFullYear()
      return year === currentYear.value && month === currentMonth.value
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
})

// ===== API: 학사일정 조회 =====
const fetchSchedules = async () => {
  try {
    const params = { year: currentYear.value }
    if (!isYearView.value) params.targetMonth = currentMonth.value
    const res = await ScheduleService.getSchedules(params)
    // FullCalendar exclusive end 처리 (endDate + 1일)
    events.value = res.data.data.map(s => {
      const endDate = new Date(s.endDate)
      endDate.setDate(endDate.getDate() + 1)
      const typeInfo = scheduleTypes.find(t => t.value === s.type)
      return {
        id: String(s.scheduleId),
        title: s.title,
        start: s.startDate,
        end: endDate.toISOString().slice(0, 10),
        backgroundColor: typeInfo ? typeInfo.bg : '#eaedf0',
        textColor: typeInfo ? typeInfo.fg : '#3c4856',
        borderColor: typeInfo ? typeInfo.bar : '#64748b',
        type: s.type,
        isActive: s.isActive,
      }
    })
  } catch (e) {
    console.error('학사일정 조회 실패', e)
  }
}

const getSemester = (dateStr) => {
  const month = new Date(dateStr).getMonth() + 1
  if (month >= 3 && month <= 8) return '1'
  return '2'
}

// ===== 시작일 변경 시 종료일 자동 세팅 =====
const onNewStartDateChange = () => {
  if (!newEvent.value.endDate || newEvent.value.endDate < newEvent.value.startDate) {
    newEvent.value.endDate = newEvent.value.startDate
  }
}

const onEditStartDateChange = () => {
  if (!editEvent.value.endDate || editEvent.value.endDate < editEvent.value.startDate) {
    editEvent.value.endDate = editEvent.value.startDate
  }
}

// ===== API: 학사일정 등록 (관리자) =====
const submitEvent = async () => {
  if (!newEvent.value.title.trim()) {
    await modal.showAlert('일정명을 작성해주세요.', 'warning')
    return
  }
  if (!newEvent.value.startDate) {
    await modal.showAlert('학사기간을 선택해주세요.', 'warning')
    return
  }
  if (newEvent.value.endDate && newEvent.value.endDate < newEvent.value.startDate) {
    await modal.showAlert('종료일이 시작일보다 빠릅니다.', 'warning')
    return
  }
  try {
    await ScheduleService.createSchedule({
      title: newEvent.value.title,
      year: currentYear.value,
      semester: getSemester(newEvent.value.startDate),
      type: newEvent.value.type,
      startDate: newEvent.value.startDate + 'T00:00:00',
      endDate: (newEvent.value.endDate || newEvent.value.startDate) + 'T23:59:59',
    })
    newEvent.value = { type: '', title: '', year: currentYear.value, semester: 1, startDate: '', endDate: '' }
    showAddForm.value = false
    await fetchSchedules() // 목록 새로고침
  } catch (e) {
    console.error('학사일정 등록 실패', e)
  }
}

// ===== API: 학사일정 수정 (관리자) =====
const submitEdit = async () => {
  if (!editEvent.value.title.trim()) {
    await modal.showAlert('일정명을 작성해주세요.', 'warning')
    return
  }
  if (!editEvent.value.startDate) {
    await modal.showAlert('학사기간을 선택해주세요.', 'warning')
    return
  }
  if (editEvent.value.endDate && editEvent.value.endDate < editEvent.value.startDate) {
    await modal.showAlert('종료일이 시작일보다 빠릅니다.', 'warning')
    return
  }
  try {
    await ScheduleService.updateSchedule(editEvent.value.id, {
      title: editEvent.value.title,
      semester: getSemester(editEvent.value.startDate),
      type: editEvent.value.type,
      startDate: editEvent.value.startDate + 'T00:00:00',
      endDate: editEvent.value.endDate + 'T23:59:59',
    })
    clearSelection()
    await fetchSchedules() // 목록 새로고침
  } catch (e) {
    console.error('학사일정 수정 실패', e)
  }
}

// ===== API: 학사일정 삭제 (관리자) =====
const deleteEvent = async () => {
  try {
    await ScheduleService.deleteSchedule(editEvent.value.id)
    clearSelection()
    await fetchSchedules() // 목록 새로고침
  } catch (e) {
    console.error('학사일정 삭제 실패', e)
  }
}

// ===== FullCalendar 옵션 =====
const calendarOptions = computed(() => ({
  plugins: [dayGridMonth, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: false,
  locale: 'ko',
  height: '100%',
  expandRows: false,
  events: events.value,
  // 선택된 이벤트에 active-bar 클래스 부여
  eventClassNames: (arg) => {
    return String(arg.event.id) === String(selectedEventId.value) ? ['active-bar'] : []
  },
  // 달력 월 변경 시 년/월 업데이트 + 새 데이터 조회
  datesSet: async (dateInfo) => {
    const date = new Date(dateInfo.start)
    date.setDate(date.getDate() + 7) // 시작일이 이전달일 수 있어서 +7
    currentYear.value = date.getFullYear()
    currentMonth.value = date.getMonth() + 1
    await fetchSchedules()
  }
}))

// ===== 네비게이션: 이전/다음 달 이동 =====
const goPrev = () => fullCalendar.value?.getApi().prev()
const goNext = () => fullCalendar.value?.getApi().next()

// ===== 이벤트 클릭: 달력 강조 + 수정/삭제 폼 표시 (관리자만 폼 표시) =====
const selectEvent = (event) => {
  if (selectedEventId.value === event.id) {
    clearSelection()
  } else {
    selectedEventId.value = event.id
    // 관리자만 수정/삭제 폼 표시
    if (isAdmin.value) {
      showEditForm.value = true
      showAddForm.value = false
      const endDate = new Date(event.end || event.start)
      endDate.setDate(endDate.getDate() - 1)
      editEvent.value = {
        id: event.id,
        type: event.type || '',
        title: event.title,
        semester: event.semester || 1,
        startDate: event.start,
        endDate: endDate.toISOString().slice(0, 10),
      }
    }
    nextTick(() => fullCalendar.value?.getApi().render())
  }
}

// ===== 선택 해제: 강조 제거 + 폼 닫기 =====
const clearSelection = () => {
  selectedEventId.value = null
  showEditForm.value = false
  nextTick(() => fullCalendar.value?.getApi().render())
}

// ===== 연간일정 데이터 가공 =====
const groupedEvents = computed(() => {
  const groups = {}
  events.value.forEach(event => {
    const month = new Date(event.start).getMonth() + 1
    const key = `${month}월`
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
  })

  const sorted = {}
  Object.keys(groups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(month => {
      sorted[month] = groups[month].sort((a, b) => new Date(a.start) - new Date(b.start))
    })
  return sorted
})

// ===== 연도 선택 팝업 =====
const showYearPicker = ref(false)
const yearPickerRef = ref(null)
const years = computed(() => Array.from({ length: 11 }, (_, i) => 2020 + i))

const selectYear = (year) => {
  currentYear.value = year
  showYearPicker.value = false
  fetchSchedules()
}

onClickOutside(yearPickerRef, () => { showYearPicker.value = false })

// ===== 초기 데이터 로드 =====
fetchSchedules()
</script>

<template>
  <div class="card">

    <!-- ===== 헤더: 년/월 표시 + 이전/다음 버튼 + 월간/연간 토글 ===== -->
    <header class="calendar-header">
      <div class="date-selector">
        <div class="year-picker-wrap" ref="yearPickerRef">
          <div class="select-box pointer" @click="showYearPicker = !showYearPicker">
            <span>{{ currentYear }}년</span>
            <font-awesome-icon :icon="['fas', showYearPicker ? 'chevron-up' : 'chevron-down']" class="year-arrow" />
          </div>
          <div v-if="showYearPicker" class="year-popup">
            <button
              v-for="y in years" :key="y"
              :class="{ active: y === currentYear }"
              @click="selectYear(y)"
            >{{ y }}</button>
          </div>
        </div>
        <!-- 월간일정일 때만 월 네비게이션 표시 -->
        <template v-if="!isYearView">
          <button class="nav-btn" @click="goPrev">
            <font-awesome-icon :icon="['fas', 'chevron-left']" />
          </button>
          <div class="month"><span>{{ currentMonth }}월</span></div>
          <button class="nav-btn" @click="goNext">
            <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </template>
      </div>
      <div class="btn-tab">
        <button :class="{ active: !isYearView }" @click="isYearView = false; fetchSchedules()">월간</button>
        <button :class="{ active: isYearView }" @click="isYearView = true; fetchSchedules()">연간</button>
      </div>
    </header>

    <main class="calendar-body">

      <!-- ===== 연간일정 뷰 ===== -->
      <section v-if="isYearView" class="year-list-container">
        <div v-for="(monthEvents, month) in groupedEvents" :key="month" class="month-section">
          <div class="month-badge">{{ month }}</div>
          <div class="month-content">
            <div v-for="event in monthEvents" :key="event.id" class="year-row">
              <div class="year-date-block">
                <span class="year-start">{{ event.start.slice(5).replace('-', '.') }}</span>
                <span class="year-tilde">~</span>
                <span class="year-end">{{ new Date(new Date(event.end).setDate(new Date(event.end).getDate() - 1)).toISOString().slice(5, 10).replace('-', '.') }}</span>
              </div>
<span class="year-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 월간일정 뷰 ===== -->
      <section v-else class="view-container">

        <!-- 달력 영역 -->
        <div class="calendar-main-area">
          <div class="fc-wrap">
            <FullCalendar ref="fullCalendar" :options="calendarOptions" />
          </div>
        </div>

        <!-- 사이드바 -->
        <aside class="calendar-sidebar">

          <!-- 일정 등록 폼 (관리자만) -->
          <div v-if="showAddForm && isAdmin" class="add-form">
            <select v-model="newEvent.type" class="form-select">
              <option value="">일정구분</option>
              <option v-for="type in scheduleTypes" :key="type.code" :value="type.code">{{ type.value }}</option>
            </select>
            <textarea v-model="newEvent.title" class="form-textarea" placeholder="학사일정(title)"></textarea>
            <div class="form-date-row">
              <label>시작날짜</label>
              <input type="date" v-model="newEvent.startDate" class="form-date" @change="onNewStartDateChange" />
            </div>
            <div class="form-date-row">
              <label>종료날짜</label>
              <input type="date" v-model="newEvent.endDate" class="form-date" />
            </div>
            <div class="form-actions">
              <button class="btn btn-default" @click="showAddForm = false">취소</button>
              <button class="btn btn-submit" @click="submitEvent">등록</button>
            </div>
          </div>

          <!-- 수정/삭제 폼 (관리자 + 일정 클릭 시) -->
          <div v-else-if="showEditForm && isAdmin" class="add-form edit-form">
            <select v-model="editEvent.type" class="form-select">
              <option value="">일정구분</option>
              <option v-for="type in scheduleTypes" :key="type.code" :value="type.code">{{ type.value }}</option>
            </select>
            <textarea v-model="editEvent.title" class="form-textarea"></textarea>
            <div class="form-date-row">
              <label>시작날짜</label>
              <input type="date" v-model="editEvent.startDate" class="form-date" @change="onEditStartDateChange" />
            </div>
            <div class="form-date-row">
              <label>종료날짜</label>
              <input type="date" v-model="editEvent.endDate" class="form-date" />
            </div>
            <div class="form-actions">
              <!-- 삭제는 왼쪽, 취소/수정은 오른쪽 -->
              <button class="btn btn-danger" @click="deleteEvent">삭제</button>
              <button class="btn btn-default" @click="clearSelection">취소</button>
              <button class="btn btn-submit" @click="submitEdit">수정</button>
            </div>
          </div>

          <!-- 일정 목록 -->
          <template v-else>
            <h3 class="sidebar-title">{{ currentYear }}년 {{ currentMonth }}월 학사일정</h3>
            <div class="event-card-list">
              <!-- 사이드에서 현재 월 일정만 표시 -->
              <div
                v-for="event in currentMonthEvents"
                :key="event.id"
                class="event-card"
                :class="{ selected: selectedEventId === event.id }"
                @click="selectEvent(event)"
              >
                <div class="card-content">
                  <h4 class="event-title">{{ event.title }}</h4>
                  <p class="event-time">{{ event.start }} ~ {{ new Date(new Date(event.end).setDate(new Date(event.end).getDate() - 1)).toISOString().slice(0, 10) }}</p>
                </div>
              </div>
            </div>
            <!-- 일정추가 버튼: 관리자만 표시 -->
            <button v-if="isAdmin" class="btn btn-default btn-add-event" @click="showAddForm = true">
              <font-awesome-icon :icon="['fas', 'plus']" /> 일정추가
            </button>
          </template>

        </aside>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.card { height: calc(100vh - 140px); display: flex; flex-direction: column; margin-bottom: 0; }

/* ===== 헤더 ===== */
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: $sm; padding-bottom:$sm; flex-shrink: 0; }
.date-selector { display: flex; gap: 10px; flex: 1; justify-content: center; margin-left: 100px; align-items: center; }
.select-box { border: 1px solid $border-color; padding: 6px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px; font-weight: 600; user-select: none; }
.month{font-weight: 600; padding: 0 $sm;font-size: $fs-lg;  }

/* 이전/다음 달 네비게이션 버튼 */
.nav-btn { border: 1px solid $border-color; background: $default-bg; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;color: $font-color; }

/* ===== 연도 선택 팝업 ===== */
.year-picker-wrap { position: relative; }
.year-arrow { font-size: $fs-xs; color: $font-color-light; }
.year-popup {
  position: absolute;  top: calc(100% + 6px);  left: 50%;  transform: translateX(-50%);
  background: #fff;  border: 1px solid $border-color;  border-radius: 10px;  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  padding: $sm;  display: grid;  grid-template-columns: repeat(3, 1fr);  gap: $xs;
  z-index: 100;  min-width: 180px;
  button {
    padding: 7px 0;  border: none;   background: none;   border-radius: 6px;   font-size: 13px;  font-weight: 600;  cursor: pointer;  color: $font-color-light;
    &:hover { background: $default-bg; }
    &.active { background: $default-bg; font-weight: 800;  color: $font-color}
  }
}

/* ===== 바디 영역: 헤더 제외 나머지 높이 채우기 ===== */
.calendar-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* ===== 월간일정 뷰 레이아웃 ===== */
.view-container { flex: 1; display: flex; min-height: 0; }
.calendar-main-area { flex: 2.5; min-height: 0; overflow: hidden; }
.calendar-sidebar { flex: 1; overflow-y: auto; min-height: 0;padding:$md 0 0 $lg;  }

/* ===== 달력 외곽 래퍼  ===== */
.fc-wrap { height: 100%; border: 1px solid $border-color; border-radius: 5px; overflow: hidden;}
/* FullCalendar */
:deep(.fc){
  .fc-scrollgrid{
    border: none !important;
    td:last-child{border-right: none !important;}
    th:last-child{border-right: none !important;}
    tr:last-child td{ border-bottom: none !important;}
  }
  .fc-col-header-cell { background-color: $default-bg; font-size: $fs-xs; font-weight: bold; }
  .fc-day-today { background-color: rgba($green-600, 0.08) !important; }
  .fc-daygrid-day-number { font-size: $fs-xs !important; opacity: .8; }
  .fc-event { font-weight: 500;font-size: $fs-xs; padding: 2px $sm; margin-bottom: 2px; border-width: 0 0 0 3px !important; box-shadow: 0 2px 2px rgba(0, 0, 0, 0.15); transition: all 0.2s ease;}
}

/* ===== 달력 이벤트 강조 (클릭 시) ===== */
:deep(.active-bar) {
  background-color: $green-600 !important; border-color: $green-600 !important; color: #fff !important; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 999 !important; 
}
:deep(.active-bar .fc-event-title) { font-weight: 700 !important; }
:deep(.active-bar .fc-event-main) { color: #fff !important; }

/* ===== 사이드바 일정 목록 ===== */
.sidebar-title { font-size: $fs-lg; font-weight: 700; color: $font-color-bold; margin-bottom: $md; }
.event-card { padding: $md $sm; border-bottom: 1px solid $border-color; cursor: pointer; transition: all 0.15s;
&:first-child{border-top: 1px solid $border-color;}
}
.event-card:hover .event-title { color: $green-600; text-decoration: underline; }
.event-card.selected .event-title { color: $green-600; font-weight: 700; }
.event-title { font-size: 14px; font-weight: 600; color: $font-color-bold; }
.event-time { font-size: 12px; color: $font-color-light; margin-top: 2px; }

/* ===== 등록/수정 폼 ===== */
.add-form { display: flex; flex-direction: column; gap: $md; }
.edit-form { border: 1.5px solid $green-600; border-radius: 8px; padding: $md; }
.form-select { border: 1px solid $border-color; border-radius: 6px; padding: 8px 12px; font-size: 14px; width: 100%; }
.form-textarea { border: 1px solid $border-color; border-radius: 6px; padding: 10px; font-size: 14px; color: $font-color; min-height: 80px; resize: none; width: 100%; }
.form-date-row { display: flex; align-items: center; gap: 12px; }
.form-date-row label { font-weight: 600; font-size: 13px; width: 60px; color: $font-color-light; flex-shrink: 0; }
.form-date { border: 1px solid $border-color; border-radius: 6px; padding: 8px 10px; font-size: 14px; flex: 1; }
.form-actions { display: flex; justify-content: flex-end; gap: $sm; }
/* 삭제 버튼은 왼쪽 정렬 */
.form-actions .btn.btn-danger { margin-right: auto; }

/* ===== 일정추가 버튼 ===== */
.btn-add-event { width: 100%; margin-top: $md; }

/* ===== 연간일정 뷰 ===== */
.year-list-container { flex: 1; overflow-y: auto; border-top: 1px solid $border-color; }
.month-section { display: flex; padding: $md 0; border-bottom: 1px solid $border-color; align-items: center; }
.month-badge { background: $default-bg; border: 1px solid $border-color; padding: 6px 16px; border-radius: 20px; font-weight: 700;  min-width: 70px; margin: 0 $sm;text-align: center; flex-shrink: 0; color: $font-color-bold; }
.month-content { flex: 1; margin-left: 32px; display: flex; flex-direction: column; gap: $sm; }
.year-row { display: flex; align-items: center; gap: 12px; }
.year-date-block { display: flex; align-items: center; gap: $xs; width: 120px; flex-shrink: 0; }
.year-start, .year-end { font-weight: 600; color: $font-color;  }
.year-tilde { color: $font-color-light;  }
.year-title {  color: $font-color-bold; }
</style>