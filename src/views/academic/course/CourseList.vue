<script setup>
import courseService from '@/services/courseService'
import { useModalStore } from '@/stores/modal'
import { useRouter } from 'vue-router'
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue'
import Pagination from '@/components/common/Pagination.vue'

const modal = useModalStore()
const router = useRouter()

const courseList = ref([])
const myCourseData = ref({
  totalEnrolledCredits: 0,
  courses: []
})

const state = reactive({
  isLoading: false,
  coursePage: 1,
  courseSize: 5,
  myPage: 1,
  mySize: 3,
})

const typeTab = ref('전체')
const searchKeyword = ref('')
const searchInput = ref('')
const selectedMajor = ref('전체')
const selectedYear = ref('전체')

const tabs = ['전체', '전공', '교양']

const majorList = computed(() => {
  const majors = courseList.value.map(item => item.majorName)
  return ['전체', ...new Set(majors)].filter(Boolean)
})

const filteredList = computed(() => {
  let list = courseList.value
  if (typeTab.value !== '전체') {
    list = list.filter(item => item.lectureType?.includes(typeTab.value))
  }
  if (selectedMajor.value !== '전체') {
    list = list.filter(item => item.majorName === selectedMajor.value)
  }
  if (selectedYear.value !== '전체') {
    list = list.filter(item => item.academicYear === Number(selectedYear.value))
  }
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    list = list.filter(item =>
      item.majorName?.toLowerCase().includes(keyword) ||
      item.lectureName?.toLowerCase().includes(keyword) ||
      item.proName?.toLowerCase().includes(keyword)
    )
  }
  return list
})

const pagedCourseList = computed(() => {
  const start = (state.coursePage - 1) * state.courseSize
  return filteredList.value.slice(start, start + state.courseSize)
})
const courseMaxPage = computed(() =>
  Math.ceil(filteredList.value.length / state.courseSize) || 1
)

const pagedMyCourseList = computed(() => {
  const start = (state.myPage - 1) * state.mySize
  return myCourseData.value.courses.slice(start, start + state.mySize)
})
const myMaxPage = computed(() =>
  Math.ceil(myCourseData.value.courses.length / state.mySize) || 1
)

const fetchCourseList = async () => {
  state.isLoading = true
  try {
    const res = await courseService.courseList()
    courseList.value = res.data.data ?? []
  } catch (e) {
    console.error('수강신청 목록 조회 실패', e)
  } finally {
    state.isLoading = false
  }
}

const fetchMyCourseList = async () => {
  try {
    const res = await courseService.myCourseList()
    const data = res.data.data
    myCourseData.value = {
      totalEnrolledCredits: data.totalEnrolledCredits ?? 0,
      courses: data.courses ?? []
    }
  } catch (e) {
    console.error('내 수강 목록 조회 실패', e)
  }
}

// 필터 변경 시 1페이지로 리셋
watch([typeTab, selectedMajor, selectedYear, searchKeyword], () => {
  state.coursePage = 1
})

watch(() => myCourseData.value.courses.length, () => {
  if (state.myPage > myMaxPage.value) state.myPage = myMaxPage.value
})

const enroll = async (lectureId) => {
  if (!await modal.showConfirm('해당 강의를 신청하시겠습니까?')) return
  try {
    const res = await courseService.postCourse({ lectureId })
    if (res) {
      await modal.showAlert('수강 신청이 완료되었습니다.', 'success')
      fetchCourseList()
      fetchMyCourseList()
    }
  } catch (e) {
    console.error('수강 신청 실패', e)
  }
}

const courseDelete = async (lectureId) => {
  if (!await modal.showConfirm('수강을 취소하시겠습니까?', 'warning')) return
  try {
    const res = await courseService.courseDel({ lectureId })
    if (res) {
      await modal.showAlert('수강 취소가 완료되었습니다.', 'success')
      fetchCourseList()
      fetchMyCourseList()
    }
  } catch (e) {
    console.error('수강 취소 실패', e)
  }
}

const isEnrolled = (lectureId) =>
  myCourseData.value.courses.some(course => String(course.lectureId) === String(lectureId))

const search = () => { searchKeyword.value = searchInput.value }
const keydown = (e) => { if (e.key === 'Enter') search() }

onMounted(async () => {
  try {
    const res = await courseService.getCourseStatus()
    const data = res.data.data
    if (!data.isOpen) {
      await modal.showAlert('수강 신청 기간이 아닙니다.', 'error')
      router.push('/member/my')
      return
    }
  } catch (e) {
    await nextTick()
    router.push('/member/my')
    return
  }
  fetchCourseList()
  fetchMyCourseList()
})
</script>

<template>
  <!-- ── 전체 강의 목록 ── -->
  <div class="container" style="padding-bottom: 30px;">
    <div class="data-header" style="margin-bottom:16px;">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 수강 신청</h2>
      <nav class="breadcrumb">수강 관리 &gt; 수강 신청</nav>
    </div>

    <div class="filter-header">
      <div class="tab-area">
        <button
          v-for="tab in tabs" :key="tab"
          :class="['filter-btn', { active: typeTab === tab }]"
          @click="typeTab = tab"
        >{{ tab }}</button>
      </div>
      <div class="filter-group">
        <div class="filter-item">
          <div class="input-label">학과</div>
          <div class="input-content">
            <select v-model="selectedMajor">
              <option v-for="major in majorList" :key="major" :value="major">{{ major }}</option>
            </select>
          </div>
        </div>
        <div class="filter-item">
          <div class="input-label">학년</div>
          <div class="input-content">
            <select v-model="selectedYear">
              <option value="전체">전체</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
              <option value="4">4학년</option>
            </select>
          </div>
        </div>
        <div class="search-area">
          <input
            v-model="searchInput"
            type="text"
            placeholder="검색어를 입력하세요"
            @keydown="keydown"
          />
          <button class="btn search-btn" @click="search">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
          </button>
        </div>
      </div>
    </div>

    <div><p>전체: {{ filteredList.length }}개</p></div>

    <section class="tbl-wrap" style="--grid-cols: 1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px;">
      <article class="tbl-head">
        <div v-for="col in ['학과명','강의명','강의실','이수구분','학년','담당교수','수업시간','학점','여석/정원','신청']" :key="col">{{ col }}</div>
      </article>
      <template v-if="!state.isLoading && pagedCourseList.length > 0">
        <article
          class="tbl-row no-hover"
          v-for="(item, idx) in pagedCourseList"
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
            <button v-if="isEnrolled(item.lectureId)" class="btn-register-success">신청완료</button>
            <button v-else class="btn-register" @click="enroll(item.lectureId)">수강신청</button>
          </div>
        </article>
      </template>
      <article v-if="state.isLoading" class="no-data"><p>불러오는 중...</p></article>
      <article v-else-if="pagedCourseList.length === 0" class="no-data"><p>조회된 강의가 없습니다.</p></article>
    </section>

    <Pagination
      :currentPage="state.coursePage"
      :maxPage="courseMaxPage"
      :pageGroupSize="5"
      @goToPage="state.coursePage = $event"
    />
  </div>

  <!-- ── 신청 내역 ── -->
  <div class="container" style="padding-bottom: 10px;">
    <div class="my-course-header">
      <h1 style="font-weight: bold;">신청 내역
        <span class="totalCredit">신청 학점: <strong>{{ myCourseData.totalEnrolledCredits }}</strong>학점</span>
      </h1>
    </div>

    <section class="tbl-wrap" style="--grid-cols: 1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px;">
      <article class="tbl-head">
        <div v-for="col in ['학과명','강의명','강의실','이수구분','학년','담당교수','수업시간','학점','여석/정원','신청']" :key="col">{{ col }}</div>
      </article>
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
              class="btn-register-del"
              @click="courseDelete(item.lectureId)"
            >수강취소</button>
            <span class="not-cancel" v-else>취소 불가</span>
          </div>
        </article>
      </template>
      <article v-else class="no-data"><p>신청한 강의가 없습니다.</p></article>
    </section>

    <Pagination
      :currentPage="state.myPage"
      :maxPage="myMaxPage"
      :pageGroupSize="5"
      @goToPage="state.myPage = $event"
    />
  </div>
</template>

<style scoped>
.page-title {
  font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.page-title .title-icon { color: var(--main-color); font-size: 0.8em; }
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.tbl-wrap { width: 100%; display: grid; }
.tbl-head, .tbl-row {
  display: grid;
  grid-template-columns: var(--grid-cols);
  align-items: center;
  text-align: center;
}
.tbl-head {
  font-size: var(--text-sm); font-weight: bold; background: #f5f5f5;
  border-radius: 5px; margin-bottom: 5px; border: 1px solid var(--table-border-color);
}
.tbl-head div { padding: 10px; }
.tbl-row {
  background: #fff; border: 1px solid var(--table-border-color); border-top-width: 0;
}
.tbl-row:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
.tbl-row:last-child { border-radius: 0 0 5px 5px; }
.tbl-row div { padding: 12px 10px; line-height: 1.2; }
.no-data {
  grid-column: 1 / -1; text-align: center; color: #aaa; padding: 40px 0;
  background: #fff; border: 1px solid var(--table-border-color); border-radius: 0 0 5px 5px;
}

.my-course-header {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--font-color);
}
.totalCredit { float: right; font-size: var(--text-md); color: var(--font-color); }
.totalCredit strong { color: var(--main-color); font-size: var(--text-lg); margin-left: 5px; }
.not-cancel { opacity: .4; cursor: default; }

.btn-register {
  background-color: var(--main-color); color: #fff; border: none;
  border-radius: 4px; padding: 5px 10px; cursor: pointer;
  font-size: var(--text-sm); white-space: nowrap;
}
.btn-register-success {
  background-color: #aaa; color: #fff; border: none;
  border-radius: 4px; padding: 5px 10px; cursor: default;
  font-size: var(--text-sm); white-space: nowrap;
}
.btn-register-del {
  background-color: #fff; color: var(--main-color);
  border: 1px solid var(--main-color); border-radius: 4px;
  padding: 5px 10px; cursor: pointer;
  font-size: var(--text-sm); white-space: nowrap;
}
</style>