<script setup>
import courseService from '@/services/courseService';
import { useModalStore } from '@/stores/modal';
import { useRouter} from 'vue-router';
import { ref, onMounted, computed, reactive, watch, nextTick } from 'vue';

const modal = useModalStore();
const router = useRouter();

const courseList = ref([]);
const myCourseData = ref({
  totalEnrolledCredits: 0,
  courses: []
});

// 페이징 및 로딩 상태 관리
const state = reactive({
  isLoading: false,
  coursePage: 1,
  courseSize: 5,
  myPage: 1,
  mySize: 3,
  totalCount: 0
});

const typeTab = ref('전체');
const searchKeyword = ref('');
const searchInput = ref('');
const selectedMajor = ref('전체');
const selectedYear = ref('전체');

const tabs = ['전체', '전공', '교양'];

// 학과 목록 추출
const majorList = computed(() => {
  const majors = courseList.value.map(item => item.majorName);
  return ['전체', ...new Set(majors)].filter(Boolean);
});

// 전체 강의 목록 필터링 및 페이징
const filteredList = computed(() => {
  let list = courseList.value;

if (typeTab.value !== '전체') {
  list = list.filter(item => item.lectureType?.includes(typeTab.value));
}
  if (selectedMajor.value !== '전체') {
    list = list.filter(item => item.majorName === selectedMajor.value);
  }
  if (selectedYear.value !== '전체') {
    list = list.filter(item => item.academicYear === Number(selectedYear.value));
  }
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    list = list.filter(item =>
      item.majorName?.toLowerCase().includes(keyword) ||
      item.lectureName?.toLowerCase().includes(keyword) ||
      item.proName?.toLowerCase().includes(keyword)
    );
  }
  return list;
});

// 전체 목록 중 현재 페이지 데이터
const pagedCourseList = computed(() => {
  const start = (state.coursePage - 1) * state.courseSize;
  return filteredList.value.slice(start, start + state.courseSize);
});

const courseMaxPage = computed(() => {
  return Math.ceil(filteredList.value.length / state.courseSize) || 1;
});

// --- [내 신청 내역 페이징] ---
const pagedMyCourseList = computed(() => {
  const start = (state.myPage - 1) * state.mySize;
  return myCourseData.value.courses.slice(start, start + state.mySize);
});

const myMaxPage = computed(() => {
  return Math.ceil(myCourseData.value.courses.length / state.mySize) || 1;
});

// 데이터 호출 함수들
const fetchCourseList = async () => {
    state.isLoading = true;
    try {
        const res = await courseService.courseList();
        courseList.value = res.data.data ?? [];
        state.totalCount = courseList.value.length;
    } catch (e) {
        console.error('수강신청 목록 조회 실패', e);
    } finally {
        state.isLoading = false;
    }
};

watch([typeTab, selectedMajor, selectedYear, searchKeyword], () => {
    state.coursePage = 1;
    // getCourseMaxPage() 제거
});

const fetchMyCourseList = async () => {
  try {
    const res = await courseService.myCourseList();
    const data = res.data.data;
    myCourseData.value = {
      totalEnrolledCredits: data.totalEnrolledCredits ?? 0,
      courses: data.courses ?? []
    };
  } catch (e) {
    console.error('내 수강 목록 조회 실패', e);
  }
};

// 페이지 이동 핸들러
const goToCoursePage = (page) => { state.coursePage = page; };
const goToMyPage = (page) => { state.myPage = page; };

const getCourseMaxPage = async () => {
  const params = {
    size: state.courseSize,
    lectureType: typeTab.value === '전체' ? '' : typeTab.value,
    academicYear: selectedYear.value === '전체' ? 0 : Number(selectedYear.value),
    majorName: selectedMajor.value === '전체' ? '' : selectedMajor.value,
    lectureName: searchKeyword.value
  }

  try {
    state.isLoading = true;
    const res = await courseService.getCourseMaxPage(params);
    const data = res.result ?? res;
    if (data) {
      state.totalCount = data.totalCount;
      state.maxPage = data.maxPage;
    }
  } catch (e) {
    console.error(e);
  } finally {
    state.isLoading = false;
  }
}

// 필터 변경 시 1페이지로 리셋
watch([typeTab, selectedMajor, selectedYear, searchKeyword], () => {
  state.coursePage = 1;
  getCourseMaxPage();
  fetchCourseList();
});

// 수강신청/취소 성공 후 내 목록 페이지 체크 (데이터가 없어지면 앞 페이지로)
watch(() => myCourseData.value.courses.length, () => {
  if (state.myPage > myMaxPage.value) state.myPage = myMaxPage.value;
});

const enroll = async (lectureId) => {
  if (!await modal.showConfirm('해당 강의를 신청하시겠습니까?')) return;
  try {
    const res = await courseService.postCourse({ lectureId });
    if (res) {
      await modal.showAlert('수강 신청이 완료되었습니다.', 'success');
      fetchCourseList();
      fetchMyCourseList();
    }
  } catch (e) {
    console.error('수강 신청 실패', e);
  }
};

const courseDelete = async (lectureId) => {
  if (!await modal.showConfirm('수강을 취소하시겠습니까?', 'warning')) return;
  try {
    const res = await courseService.courseDel({ lectureId });
    if (res) {
      await modal.showAlert('수강 취소가 완료되었습니다.', 'success');
      fetchCourseList();
      fetchMyCourseList();
    }
  } catch (e) {
    console.error('수강 취소 실패', e);
  }
};

const isEnrolled = (lectureId) => 
  myCourseData.value.courses.some(course => String(course.lectureId) === String(lectureId));
const search = () => { searchKeyword.value = searchInput.value; };
const keydown = (e) => { if (e.key === 'Enter') search(); };

onMounted(async () => {
    try {
        const res = await courseService.getCourseStatus();
        const data = res.data.data;
        if (!data.isOpen) {
            await modal.showAlert('수강 신청 기간이 아닙니다.', 'error');
            router.push('/member/my');
            return;
        }
    } catch (e) {
        // httpRequester alert가 끝난 후 이동하도록 nextTick 사용
        await nextTick();
        router.push('/member/my');
        return;
    }

    fetchCourseList();
    fetchMyCourseList();
});

// 전체 강의 페이지 그룹
const coursePageGroup = computed(() => {
  const groupSize = 5;
  const current = state.coursePage;
  const start = Math.floor((current - 1) / groupSize) * groupSize + 1;
  const end = Math.min(start + groupSize - 1, courseMaxPage.value);
  return { start, end, hasPrev: start > 1, hasNext: end < courseMaxPage.value };
});

// 내 신청 페이지 그룹
const myPageGroup = computed(() => {
  const groupSize = 5;
  const current = state.myPage;
  const start = Math.floor((current - 1) / groupSize) * groupSize + 1;
  const end = Math.min(start + groupSize - 1, myMaxPage.value);
  return { start, end, hasPrev: start > 1, hasNext: end < myMaxPage.value };
});
</script>

<template>
  <div class="container" style="padding-bottom: 30px;">
    <div class="data-header" style="margin-bottom:16px;">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 수강 신청</h2>
      <nav class="breadcrumb">수강 관리 &gt; 수강 신청</nav>
    </div>

    <div class="filter-header">
      <div class="tab-area">
        <button v-for="tab in tabs" :key="tab" :class="['filter-btn', { active: typeTab === tab }]"
          @click="typeTab = tab">{{ tab }}</button>
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
        <div class="filter-item input-content">
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
          <div class="input-content">
            <input v-model="searchInput" type="text" placeholder="검색어를 입력하세요" class="input-box" @keydown="keydown" />
          </div>
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
        <article class="tbl-row no-hover" v-for="(item, idx) in pagedCourseList" :key="item.lectureId ?? idx">
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

<div v-if="courseMaxPage > 1" class="d-flex jc-center g5" style="margin-top:15px;">
  <button v-if="coursePageGroup.hasPrev" class="page-btn"
    @click="state.coursePage = coursePageGroup.start - 1">&lt;&lt;</button>
  <button v-for="p in Array.from({length: coursePageGroup.end - coursePageGroup.start + 1}, (_, i) => coursePageGroup.start + i)"
    :key="p" class="page-btn" :class="{ active: p === state.coursePage }"
    @click="state.coursePage = p">{{ p }}</button>
  <button v-if="coursePageGroup.hasNext" class="page-btn"
    @click="state.coursePage = coursePageGroup.end + 1">&gt;&gt;</button>
</div>
  </div>

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
        <article class="tbl-row no-hover" v-for="(item, idx) in pagedMyCourseList" :key="item.lectureId ?? idx">
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
            <button v-if="item.isAttended === 0" class="btn-register-del"
              @click="courseDelete(item.lectureId)">수강취소</button>
            <span class="not-cancel" v-else>취소 불가</span>
          </div>
        </article>
      </template>
      <article v-else class="no-data"><p>신청한 강의가 없습니다.</p></article>
    </section>

<div v-if="myMaxPage > 1" class="d-flex jc-center g5" style="margin-top:15px;">
  <button v-if="myPageGroup.hasPrev" class="page-btn"
    @click="state.myPage = myPageGroup.start - 1">&lt;&lt;</button>
  <button v-for="p in Array.from({length: myPageGroup.end - myPageGroup.start + 1}, (_, i) => myPageGroup.start + i)"
    :key="p" class="page-btn" :class="{ active: p === state.myPage }"
    @click="state.myPage = p">{{ p }}</button>
  <button v-if="myPageGroup.hasNext" class="page-btn"
    @click="state.myPage = myPageGroup.end + 1">&gt;&gt;</button>
</div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.page-title .title-icon { color: var(--main-color); font-size: 0.8em; }
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.tbl-wrap { width: 100%; display: grid;}
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

.page-btn {
  width: 32px; height: 32px; border: 1px solid var(--line-color);
  border-radius: 4px; background: #fff; cursor: pointer;
  font-size: var(--text-sm); color: var(--font-color-light); transition: all 0.2s;
}
.page-btn:hover { border-color: var(--main-color); color: var(--main-color); }
.page-btn.active { background: var(--main-color); color: #fff; border-color: var(--main-color); }

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