<script setup>
import { ref, computed, nextTick } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridMonth from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import ScheduleService from '@/services/scheduleService' // ===== scheduleService =====
import { useAuthStore } from '@/stores/authentication' // ===== pinia store =====

// ===== 권한 확인 =====
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.role === 'ADMIN')

// ===== 데이터 =====
const events = ref([])

// ===== 상태 관리 =====
const fullCalendar = ref(null)
const isYearView = ref(false)
const selectedEventId = ref(null)
const showAddForm = ref(false)
const showEditForm = ref(false)

// ===== 폼 데이터 =====
const newEvent = ref({ type: '', title: '', year: 2026, semester: 1, startDate: '', endDate: '' })
const editEvent = ref({ id: '', type: '', title: '', semester: 1, startDate: '', endDate: '' })

// ===== 현재 표시 중인 년/월 (네비게이션용) =====
const currentYear = ref(2026)
const currentMonth = ref(5)

// ===== 일정 구분 타입 목록 (EnumScheduleType 기반) =====
const scheduleTypes = [
  { code: 'COURSE_REGISTRATION', value: '수강신청' },
  { code: 'COURSE_MODIFICATION', value: '수강정정' },
  { code: 'GRADE_INPUT', value: '성적입력' },
  { code: 'GRADE_VIEW', value: '성적조회' },
  { code: 'GRADE_APPEAL', value: '성적이의신청' },
  { code: 'LECTURE_EVALUATION', value: '강의평가' },
  { code: 'TUITION_PAYMENT', value: '등록금납부' },
  { code: 'COURSE_OPEN', value: '강의개설신청' },
  { code: 'ETC', value: '기타' },
]

// ===== 현재 월 일정만 필터링 =====
const currentMonthEvents = computed(() => {
  return events.value.filter(event => {
    const month = new Date(event.start).getMonth() + 1
    const year = new Date(event.start).getFullYear()
    return year === currentYear.value && month === currentMonth.value
  })
})

// ===== API: 학사일정 조회 =====
const fetchSchedules = async () => {
  try {
    const res = await ScheduleService.getSchedules({ year: currentYear.value, targetMonth: currentMonth.value })
    // FullCalendar exclusive end 처리 (endDate + 1일)
    events.value = res.data.data.map(s => {
      const endDate = new Date(s.endDate)
      endDate.setDate(endDate.getDate() + 1)
      return {
        id: String(s.scheduleId),
        title: s.title,
        start: s.startDate,
        end: endDate.toISOString().slice(0, 10),
        color: '#e2e8f0',
        type: s.type,
        isActive: s.isActive,
      }
    })
  } catch (e) {
    console.error('학사일정 조회 실패', e)
  }
}

// ===== API: 학사일정 등록 (관리자) =====
const submitEvent = async () => {
  if (!newEvent.value.title || !newEvent.value.startDate) return
  try {
    await ScheduleService.createSchedule({
      title: newEvent.value.title,
      year: currentYear.value,
      semester: newEvent.value.semester,
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
  try {
    await ScheduleService.updateSchedule(editEvent.value.id, {
      title: editEvent.value.title,
      semester: editEvent.value.semester,
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
  height: 650,
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
    const month = new Date(event.start).getMonth() + 1 + '월'
    if (!groups[month]) groups[month] = []
    groups[month].push(event)
  })
  return groups
})

// ===== 초기 데이터 로드 =====
fetchSchedules()
</script>

<template>
  <div class="academic-wrapper">

    <!-- ===== 헤더: 년/월 표시 + 이전/다음 버튼 + 월간/연간 토글 ===== -->
    <header class="calendar-header">
      <div class="date-selector">
        <div class="select-box"><span>{{ currentYear }}년</span></div>
        <!-- 월간일정일 때만 월 네비게이션 표시 -->
        <template v-if="!isYearView">
          <button class="nav-btn" @click="goPrev">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <div class="select-box"><span>{{ currentMonth }}월</span></div>
          <button class="nav-btn" @click="goNext">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </template>
      </div>
      <div class="view-controls">
        <div class="toggle-group">
          <button :class="{ active: !isYearView }" @click="isYearView = false">월간일정</button>
          <button :class="{ active: isYearView }" @click="isYearView = true">연간일정</button>
        </div>
      </div>
    </header>

    <main class="calendar-body">

      <!-- ===== 연간일정 뷰 ===== -->
      <section v-if="isYearView" class="year-list-container">
        <div v-for="(monthEvents, month) in groupedEvents" :key="month" class="month-section">
          <div class="month-badge">{{ month }}</div>
          <div class="month-content">
            <div v-for="event in monthEvents" :key="event.id" class="year-row">
              <span class="year-date">{{ event.start.slice(5).replace('-', '.') }} ~ {{ (event.end || event.start).slice(5).replace('-', '.') }}</span>
              <span class="year-title">{{ event.title }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 월간일정 뷰 ===== -->
      <section v-else class="view-container">

        <!-- 달력 영역 -->
        <div class="calendar-main-area">
          <FullCalendar ref="fullCalendar" :options="calendarOptions" />
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
              <input type="date" v-model="newEvent.startDate" class="form-date" />
            </div>
            <div class="form-date-row">
              <label>종료날짜</label>
              <input type="date" v-model="newEvent.endDate" class="form-date" />
            </div>
            <div class="form-actions">
              <button class="btn-cancel" @click="showAddForm = false">취소</button>
              <button class="btn-submit" @click="submitEvent">등록</button>
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
              <input type="date" v-model="editEvent.startDate" class="form-date" />
            </div>
            <div class="form-date-row">
              <label>종료날짜</label>
              <input type="date" v-model="editEvent.endDate" class="form-date" />
            </div>
            <div class="form-actions">
              <!-- 삭제는 왼쪽, 취소/수정은 오른쪽 -->
              <button class="btn-delete" @click="deleteEvent">삭제</button>
              <button class="btn-cancel" @click="clearSelection">취소</button>
              <button class="btn-submit" @click="submitEdit">수정</button>
            </div>
          </div>

          <!-- 일정 목록 -->
          <template v-else>
            <h3 class="sidebar-title">{{ currentYear }}년 {{ currentMonth }}월 학사일정</h3>
            <div class="event-card-list">
              <!-- 현재 월 일정만 표시 -->
              <div
                v-for="event in currentMonthEvents"
                :key="event.id"
                class="event-card"
                :class="{ selected: selectedEventId === event.id }"
                @click="selectEvent(event)"
              >
                <div class="card-content">
                  <h4 class="event-title">{{ event.title }}</h4>
                  <p class="event-time">{{ event.start }} ~ {{ event.end || event.start }}</p>
                </div>
              </div>
            </div>
            <!-- 일정추가 버튼: 관리자만 표시 -->
            <button v-if="isAdmin" class="btn-add-event" @click="showAddForm = true">
              <i class="fa-solid fa-plus"></i> 일정추가
            </button>
          </template>

        </aside>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ===== 전체 레이아웃 ===== */
.academic-wrapper { max-width: 1300px; margin: 0 auto; padding: 25px; background-color: #fff; }

/* ===== 헤더 ===== */
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
.date-selector { display: flex; gap: 10px; flex: 1; justify-content: center; margin-left: 100px; align-items: center; }
.select-box { border: 1px solid #e2e8f0; padding: 6px 16px; border-radius: 20px; display: flex; align-items: center; gap: 8px; font-weight: 700; }

/* 이전/다음 달 네비게이션 버튼 */
.nav-btn { border: 1px solid #e2e8f0; background: #f8fafc; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.nav-btn:hover { background: #e2e8f0; }

/* ===== 월간/연간 토글 ===== */
.toggle-group button { border: 1px solid #e2e8f0; background: #f8fafc; padding: 8px 16px; border-radius: 20px; cursor: pointer; }
.toggle-group button.active { background: #b91c1c; color: white; border-color: #b91c1c; }

/* ===== 월간일정 뷰 레이아웃 ===== */
.view-container { display: flex; gap: 30px; height: 690px; }
.calendar-main-area { flex: 2.5; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
.calendar-sidebar { flex: 1; border-top: 2px solid #334155; padding-top: 20px; overflow-y: auto; }

/* ===== 달력 이벤트 강조 (클릭 시) ===== */
:deep(.active-bar) {
  background-color: #1e293b !important;
  border-color: #0f172a !important;
  color: #ffffff !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 999 !important;
  transition: all 0.2s ease;
}
:deep(.active-bar .fc-event-title) { font-weight: 800 !important; }

/* ===== 사이드바 일정 목록 ===== */
.sidebar-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; }
.event-card { padding: 12px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: all 0.15s; }
.event-card:hover .event-title { color: #b91c1c; text-decoration: underline; }
.event-card.selected .event-title { color: #b91c1c; font-weight: 800; }
.event-title { font-size: 16px; font-weight: 700; color: #334155; }
.event-time { font-size: 13px; color: #94a3b8; }

/* ===== 등록/수정 폼 ===== */
.add-form { display: flex; flex-direction: column; gap: 16px; }
.edit-form { border: 1.5px solid #c4b5fd; border-radius: 12px; padding: 20px; } /* 수정 폼은 보라색 테두리 */
.form-select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
.form-textarea { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 18px; color: #334155; min-height: 80px; resize: none; }
.form-date-row { display: flex; align-items: center; gap: 12px; }
.form-date-row label { font-weight: 700; font-size: 14px; width: 60px; }
.form-date { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 14px; flex: 1; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { border: 1px solid #e2e8f0; background: #f8fafc; padding: 8px 20px; border-radius: 8px; cursor: pointer; }
.btn-submit { background: #334155; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; }
.btn-delete { background: #b91c1c; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; margin-right: auto; } /* 삭제 버튼은 왼쪽 정렬 */

/* ===== 일정추가 버튼 ===== */
.btn-add-event { width: 100%; margin-top: 20px; padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 30px; font-weight: 700; cursor: pointer; }

/* ===== 연간일정 뷰 ===== */
.year-list-container { border-top: 2px solid #334155; padding-top: 20px; }
.month-section { display: flex; padding: 20px 0; border-bottom: 1px solid #f1f5f9; align-items: center; }
.month-badge { background: #f1f5f9; padding: 8px 20px; border-radius: 20px; font-weight: 800; min-width: 80px; text-align: center; }
.month-content { flex: 1; margin-left: 40px; }
.year-row { display: flex; margin-bottom: 10px; }
.year-date { font-weight: 700; width: 150px; color: #475569; }
</style>