<script setup>
import courseService from '@/services/courseService'
import MemberService from '@/services/memberService'
import ScheduleService from '@/services/scheduleService'
import { useModalStore } from '@/stores/modal'
import { ref, onMounted, computed, reactive } from 'vue'
import Pagination from '@/components/common/Pagination.vue'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'

const modal = useModalStore()

const isPeriod = ref(true)

// ─── 수강 가능 강의 (서버 페이징) ────────────────────────────────
const courseList         = ref([])
const courseTotalPages   = ref(1)
const courseTotalElements = ref(0)

// ─── 내 수강 신청 목록 (전체 반환 → 클라이언트 페이징 유지) ────────
const myCourseData = ref({
  totalEnrolledCredits: 0,
  courses: []
})

const state = reactive({
  isLoading:  false,
  coursePage: 1,
  courseSize: 5,
  myPage:     1,
  mySize:     3,
})

// ─── 필터 상태 ────────────────────────────────────────────────────
const typeTab         = ref('전체')
const searchInput     = ref('')
const selectedMajorId = ref(null)   // 백엔드 파라미터: majorId (Long)
const selectedYear    = ref(null)   // 백엔드 파라미터: academicYear (Integer)

const tabs = ['전체', '전공', '교양']
// 탭 → 백엔드 lectureType 값 매핑
const TAB_TYPE_MAP = { '전체': null, '전공': 'MAJOR', '교양': 'GENERAL' }


// ─── 학과 목록 (필터용) ───────────────────────────────────────────
const majorOptions = ref([])

const hasFilter = computed(() =>
  selectedMajorId.value !== null ||
  selectedYear.value !== null ||
  typeTab.value !== '전체'
)

// ─── 내 수강 목록 클라이언트 페이징 ──────────────────────────────
const pagedMyCourseList = computed(() => {
  const start = (state.myPage - 1) * state.mySize
  return myCourseData.value.courses.slice(start, start + state.mySize)
})
const myMaxPage = computed(() =>
  Math.ceil(myCourseData.value.courses.length / state.mySize) || 1
)

// ─── 수강 가능 강의 fetch ─────────────────────────────────────────
async function fetchCourseList() {
  state.isLoading = true
  try {
    const res = await courseService.courseList({
      lectureType:  TAB_TYPE_MAP[typeTab.value],
      majorId:      selectedMajorId.value || null,
      academicYear: selectedYear.value    || null,
      search:       searchInput.value.trim() || null,
      page:         state.coursePage - 1,
      size:         state.courseSize,
    })
    const pageData            = res.data?.data ?? {}
    courseList.value          = pageData.content      ?? []
    courseTotalPages.value    = pageData.totalPages    ?? 1
    courseTotalElements.value = pageData.totalElements ?? 0
  } catch (e) {
    console.error('수강신청 목록 조회 실패', e)
  } finally {
    state.isLoading = false
  }
}

async function fetchMyCourseList() {
  try {
    const res = await courseService.myCourseList()
    const data = res.data.data
    myCourseData.value = {
      totalEnrolledCredits: data.totalEnrolledCredits ?? 0,
      courses:              data.courses              ?? []
    }
  } catch (e) {
    console.error('내 수강 목록 조회 실패', e)
  }
}

async function fetchDepartments() {
  try {
    const res = await MemberService.getMajorList()
    majorOptions.value = res.data ?? []
  } catch (err) {
    console.error('전공 목록 로드 실패:', err)
  }
}

// ─── 이벤트 핸들러 ────────────────────────────────────────────────
function onTabChange(tab) {
  typeTab.value    = tab
  state.coursePage = 1
  fetchCourseList()
}

function onMajorChange() {
  state.coursePage = 1
  fetchCourseList()
}

function onYearChange() {
  state.coursePage = 1
  fetchCourseList()
}

function onSearch() {
  state.coursePage = 1
  fetchCourseList()
}

function resetFilter() {
  typeTab.value         = '전체'
  selectedMajorId.value = null
  selectedYear.value    = null
  searchInput.value     = ''
  state.coursePage      = 1
  fetchCourseList()
}

function onCoursePageChange(page) {
  state.coursePage = page
  fetchCourseList()
}

// ─── 수강 신청 / 취소 ─────────────────────────────────────────────
const isEnrolled = (lectureId) =>
  myCourseData.value.courses.some(c => String(c.lectureId) === String(lectureId))

async function enroll(lectureId) {
  if (!await modal.showConfirm('해당 강의를 신청하시겠습니까?')) return
  try {
    await courseService.postCourse({ lectureId })
    await modal.showAlert('수강 신청이 완료되었습니다.', 'success')
    fetchCourseList()
    fetchMyCourseList()
  } catch (e) {
    console.error('수강 신청 실패', e)
  }
}

async function courseDelete(lectureId) {
  if (!await modal.showConfirm('수강을 취소하시겠습니까?', 'warning')) return
  try {
    await courseService.courseDel({ lectureId })
    await modal.showAlert('수강 취소가 완료되었습니다.', 'success')
    fetchCourseList()
    fetchMyCourseList()
  } catch (e) {
    console.error('수강 취소 실패', e)
  }
}

// ─── 마운트 ───────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await ScheduleService.getActiveSchedules()
    const scheduleData = res.data?.data
    isPeriod.value = !!(scheduleData?.수강신청 || scheduleData?.수강정정)
    if (!isPeriod.value) return
  } catch (e) {
    console.error('수강 상태 확인 실패', e)
    isPeriod.value = false
    return
  }

  await fetchDepartments()
  fetchCourseList()
  fetchMyCourseList()
})
</script>

<template>
  <div v-if="!isPeriod" class="empty-period">수강신청 기간이 아닙니다.</div>

  <div v-else>

    <div>
      <FilterBar
        v-model:searchQuery="searchInput"
        :hasFilter="hasFilter"
        :showSearch="true"
        :show-count="true"
        :count="courseTotalElements"
        placeholder="검색어를 입력하세요"
        @search="onSearch"
        @reset="resetFilter"
      >
        <div class="tab-area">
          <button
            v-for="tab in tabs" :key="tab"
            class="filter-btn"
            :class="{ active: typeTab === tab }"
            @click="onTabChange(tab)"
          >{{ tab }}</button>
        </div>

        <div class="filter-item">
          <div class="input-label">학과</div>
          <div class="input-content">
            <select v-model="selectedMajorId" @change="onMajorChange">
              <option :value="null">전체</option>
              <option v-for="major in majorOptions" :key="major.majorId" :value="major.majorId">{{ major.name }}</option>
            </select>
          </div>
        </div>

        <div class="filter-item">
          <div class="input-label">학년</div>
          <div class="input-content">
            <select v-model="selectedYear" @change="onYearChange">
              <option :value="null">전체</option>
              <option :value="1">1학년</option>
              <option :value="2">2학년</option>
              <option :value="3">3학년</option>
              <option :value="4">4학년</option>
            </select>
          </div>
        </div>
      </FilterBar>

      <DataTable
        :columns="['학과명','강의명','강의실','이수구분','학년','담당교수','수업시간','학점','여석/정원','신청']"
        :rows="courseList"
        :isLoading="state.isLoading"
        gridCols="1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px"
        emptyMessage="조회된 강의가 없습니다."
      >
        <template v-if="!state.isLoading && courseList.length > 0">
          <article
            class="tbl-row no-hover"
            v-for="(item, idx) in courseList"
            :key="item.lectureId ?? idx"
          >
            <div>{{ item.majorName }}</div>
            <div>{{ item.lectureName }}</div>
            <div>{{ item.building }} {{ item.roomNumber }}</div>
            <div>{{ item.lectureType }}</div>
            <div>{{ item.academicYear }}</div>
            <div>{{ item.proName }}</div>
            <div>{{ item.dayOfWeek }} {{ item.startPeriod }}교시~ {{ item.endPeriod }}교시</div>
            <div>{{ item.credit }}</div>
            <div>{{ item.remStd }}/{{ item.maxStd }}</div>
            <div>
              <button v-if="isEnrolled(item.lectureId)" class="btn btn-default btn-sm" disabled>신청완료</button>
              <button v-else class="btn btn-submit btn-sm" @click="enroll(item.lectureId)">수강신청</button>
            </div>
          </article>
        </template>
      </DataTable>

      <Pagination
        :currentPage="state.coursePage"
        :maxPage="courseTotalPages"
        :pageGroupSize="5"
        @goToPage="onCoursePageChange"
      />
    </div>

    <!-- 신청 내역 — 독립 섹션, 로딩 없음 -->
    <div class="d-flex jc-space-b ai-center mt-md" style="margin-bottom: 14px;">
      <p class="section-title" style="margin: 0;">신청 내역</p>
      <span style="font-size: 0.9em;">
        신청 학점: <strong style="color: var(--main-color);">{{ myCourseData.totalEnrolledCredits }}</strong>학점
      </span>
    </div>

    <DataTable
      :columns="['학과명','강의명','강의실','이수구분','학년','담당교수','수업시간','학점','여석/정원','신청']"
      :rows="pagedMyCourseList"
      :isLoading="false"
      gridCols="1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px"
      emptyMessage="신청한 강의가 없습니다."
    >
      <template v-if="pagedMyCourseList.length > 0">
        <article
          class="tbl-row no-hover"
          v-for="(item, idx) in pagedMyCourseList"
          :key="item.lectureId ?? idx"
        >
          <div>{{ item.majorName }}</div>
          <div>{{ item.lectureName }}</div>
          <div>{{ item.building }} {{ item.roomNumber }}</div>
          <div>{{ item.lectureType }}</div>
          <div>{{ item.academicYear }}</div>
          <div>{{ item.proName }}</div>
          <div>{{ item.dayOfWeek }} {{ item.startPeriod }}교시~ {{ item.endPeriod }}교시</div>
          <div>{{ item.credit }}</div>
          <div>{{ item.remStd }}/{{ item.maxStd }}</div>
          <div>
            <button
              v-if="item.isAttended === 0"
              class="btn btn-danger btn-sm"
              @click="courseDelete(item.lectureId)"
            >수강취소</button>
            <span class="c-default" style="opacity: .4;" v-else>취소 불가</span>
          </div>
        </article>
      </template>
    </DataTable>

    <Pagination
      :currentPage="state.myPage"
      :maxPage="myMaxPage"
      :pageGroupSize="5"
      @goToPage="state.myPage = $event"
    />
  </div>
</template>
