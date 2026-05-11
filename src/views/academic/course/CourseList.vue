<script setup>
import courseService from '@/services/courseService';
import { useModalStore } from '@/stores/modal';
import { useRouter} from 'vue-router';
import { ref, onMounted, computed, reactive, watch } from 'vue';
import DataTable from '@/components/common/DataTable.vue';

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
  // 전체 강의 목록용 페이징
  coursePage: 1,
  courseSize: 5,
  // 내 신청 내역용 페이징
  myPage: 1,
  mySize: 3,
  pageGroupSize: 5,
  totalCount:0
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
  list = list.filter(item => item.status === 'approved');

  if (typeTab.value !== '전체') {
    list = list.filter(item => item.lectureType === typeTab.value);
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
        courseList.value = res.result ?? res ?? [];
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
    myCourseData.value = res.result ?? res;
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

const isEnrolled = (lectureId) => myCourseData.value.courses.some(course => course.lectureId === lectureId);
const search = () => { searchKeyword.value = searchInput.value; };
const keydown = (e) => { if (e.key === 'Enter') search(); };

onMounted(async () => {
    // 수강 신청 기간 + 학생 상태는 서버(인터셉터)에서 검증
    // getCourseStatus() 403 응답이 오면 catch에서 처리됨
    try {
        const res = await courseService.getCourseStatus();
        const data = res.result ?? res;
        if (!data.isOpen) {
            await modal.showAlert('수강 신청 기간이 아닙니다.', 'error');
            router.go(-1);
            return;
        }
    } catch (e) {
        // 인터셉터에서 403 반환 시 (미재학, 기간 아님 등)
        await modal.showAlert('수강 신청 페이지에 접근할 수 없습니다.', 'error');
        router.go(-1);
        return;
    }

    fetchCourseList();
    fetchMyCourseList();
});
</script>

<template>
  <div class="container">
    <div class="filter-header">
      <div class="tab-area">
        <button v-for="tab in tabs" :key="tab" :class="['filter-btn', { active: typeTab === tab }]"
          @click="typeTab = tab">
          {{ tab }}
        </button>
      </div>
      <div class="filter-group">
        <div class="filter-item">
          <div class="input-label">학과</div>
          <div class="input-content">
            <select v-model="selectedMajor">
              <option v-for="major in majorList" :key="major" :value="major">
                {{ major }}
              </option>
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
            <button class="btn search-btn" @click="search"><font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색</button>
        </div>
      </div>
    </div>

    <div>
        <p>전체: {{ state.totalCount }}개</p>
    </div>

    <DataTable :columns="['학과명', '강의명', '강의실', '이수구분', '학년', '담당교수', '수업시간', '학점', '여석/정원', '신청']"
      :rows="pagedCourseList" :isLoading="state.isLoading"
      gridCols="1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px" emptyMessage="조회된 강의가 없습니다.">
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
    </DataTable>

    <Pagination :currentPage="state.coursePage" :maxPage="courseMaxPage" :pageGroupSize="state.pageGroupSize"
      @goToPage="goToCoursePage" />
  </div>

  <div class="container">
    <div class="my-course-header">
      <h1 style="font-weight: bold;">신청 내역
        <span class="totalCredit">신청 학점: <strong>{{ myCourseData.totalEnrolledCredits }}</strong>학점</span>
      </h1>
    </div>

    <DataTable :columns="['학과명', '강의명', '강의실', '이수구분', '학년', '담당교수', '수업시간', '학점', '여석/정원', '신청']"
      :rows="pagedMyCourseList" gridCols="1fr 1fr 200px 100px 50px 100px 200px 50px 100px 100px"
      emptyMessage="신청한 강의가 없습니다.">
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
    </DataTable>

    <Pagination :currentPage="state.myPage" :maxPage="myMaxPage" :pageGroupSize="state.pageGroupSize"
      @goToPage="goToMyPage" />
  </div>
</template>

<style scoped>
/* 헤더 및 기타 레이아웃 보정 */
.my-course-header {
  margin-top: 40px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--font-color);
}

.totalCredit {
  float: right;
  font-size: var(--text-md);
  color: var(--font-color);
}

.totalCredit strong {
  color: var(--main-color);
  font-size: var(--text-lg);
  margin-left: 5px;
}
.not-cancel{opacity: .4;cursor: default;}
</style>
