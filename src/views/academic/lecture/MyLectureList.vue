<script setup>
import { useAuthStore } from '@/stores/authentication';
import LectureService from '@/services/lectureService';
import ScheduleService from '@/services/scheduleService';
import { reactive, onMounted, computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Pagination from '@/components/common/Pagination.vue';
import { APPROVAL_STATUS } from '@/utils/constants';
import { scheduleText, roomText } from '@/utils/scheduleHelpers';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ── 검색어 ──────────────────────────────────────
const searchQuery = ref('');
const searchInput = ref('');

// ── 현재 학기 ────────────────────────────────────
const getCurrentTerm = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    semester: (now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8) ? 1 : 2,
  };
};

// ── 역할 판단 ────────────────────────────────────
const isAdmin = computed(() => authStore.role === 'ADMIN');
const isProfessor = computed(() => authStore.role === 'PROFESSOR');
const isStudent = computed(() => authStore.role === 'STUDENT');

// ── 학사일정 기간 상태 (학생용) ────────────────────
const periodMessage = ref('');
const modificationNotice = ref('');

const fetchPeriodStatus = async () => {
  if (!isStudent.value) return;
  try {
    const res = await ScheduleService.getActiveSchedules();
    const active = res.data?.data ?? {};
    const isRegistration = active.COURSE_REGISTRATION || active['수강신청'];
    const isModification = active.COURSE_MODIFICATION || active['수강정정'];

    if (isRegistration) {
      periodMessage.value = '수강신청 기간 중에는 내 강의 목록을 확인할 수 없습니다. 수강신청 기간 종료 후 확인해 주세요.';
      modificationNotice.value = '';
    } else if (isModification) {
      periodMessage.value = '';
      modificationNotice.value = '수강정정 기간 중입니다. 정정 기간 종료 후 최종 수강내역을 확인할 수 있습니다.';
    } else {
      periodMessage.value = '';
      modificationNotice.value = '';
    }
  } catch (e) {
    periodMessage.value = '';
    modificationNotice.value = '';
  }
};

// ── 탭 (교수만) ───────────────────────────────────
const TABS = ['전체', '대기', '승인', '반려'];
const STATUS_MAP = { '대기': 'PENDING', '승인': 'APPROVED', '반려': 'REJECTED' };
const activeTab = ref('승인');

const onTabClick = (tab) => {
  activeTab.value = tab;
  filter.status = STATUS_MAP[tab] || '';
  state.currentPage = 1;
  pushQuery();
};

// ── 상태 ────────────────────────────────────────
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 30]

const state = reactive({
  list: [],
  totalCount: 0,
  isLoading: false,
  currentPage: 1,
});

const filter = reactive({
  year: '',
  semester: '',
  status: '',   // 교수만 사용
});

const semesterOptions = [1, 2];
const yearOptions = ref([]);

// ── lectureType 한글 변환 ──────────────────────────
const LECTURE_TYPE_LABEL = {
  GENERAL_REQUIRED: '교양필수',
  GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',
  MAJOR_ELECTIVE: '전공선택',
};
const lectureTypeLabel = (code) => LECTURE_TYPE_LABEL[code] || code;

// ── 테이블 컬럼 설정 ──────────────────────────────
const tableConfig = computed(() => {
  if (isProfessor.value) {
    return {
      cols: ['이수구분', '강의명', '전공명', '강의시간', '강의실', '학점', '대상학년', '승인상태'],
      grid: '90px 3fr 130px 180px 130px 60px 70px 80px',
    };
  }
  // 학생
  return {
    cols: ['이수구분', '강의명', '교수명', '강의시간', '강의실', '학점'],
    grid: 'minmax(90px, 1fr) 4fr minmax(200px, 1fr) minmax(200px, 1fr) minmax(150px, 1fr) minmax(60px, 1fr)',
  };
});

const maxPage = ref(1);

// ── API 호출 ─────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      lectureName: searchInput.value || undefined,
      page: state.currentPage,
      size: pageSize.value,
    };
    if (isProfessor.value && filter.status) {
      params.status = filter.status;
    }
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    let page = {};
    if (isProfessor.value) {
      const res = await LectureService.getProfessorMyLectures(params);
      page = res.data ?? {};
    } else if (isStudent.value) {
      const res = await LectureService.getStudentMyLectures(params);
      page = res.data ?? {};
    }
    state.list       = page.content ?? [];
    state.totalCount = Number(page.totalElements ?? 0);
    maxPage.value    = page.totalPages ?? 1;

  } catch (err) {
    console.error('내 강의 목록 로드 실패:', err);
    state.list = [];
    state.totalCount = 0;
  } finally {
    state.isLoading = false;
  }
};

// ── URL ↔ 필터 동기화 ──────────────────────────────
const syncFromQuery = (query) => {
  const { year: curYear, semester: curSemester } = getCurrentTerm();
  filter.year = query.year ? Number(query.year) : curYear;
  filter.semester = query.semester !== undefined
    ? (query.semester ? Number(query.semester) : '')
    : curSemester;
  filter.status = query.status || '';
  searchInput.value = query.search || '';
  searchQuery.value = query.search || '';
  state.currentPage = query.page ? Number(query.page) : 1;

  // 탭 동기화
  const tabLabel = APPROVAL_STATUS[query.status] || '전체';
  activeTab.value = tabLabel === '전체' ? '전체' : tabLabel;
};

const pushQuery = () => {
  router.push({
    path: route.path,
    query: {
      year: filter.year || undefined,
      semester: filter.semester !== '' ? filter.semester : undefined,
      status: filter.status || undefined,
      search: searchInput.value || undefined,
      page: state.currentPage,
    },
  });
};

// ── 검색 ─────────────────────────────────────────
const onSearch = () => {
  searchInput.value = searchQuery.value;
  state.currentPage = 1;
  pushQuery();
};

// ── 필터 변경 ─────────────────────────────────────
const onFilterChange = () => {
  state.currentPage = 1;
  pushQuery();
};

// ── 페이지 이동 ───────────────────────────────────
const goToPage = (page) => {
  state.currentPage = page;
  router.push({ path: route.path, query: { ...route.query, page } });
};

// ── 상세 이동 ─────────────────────────────────────
const moveToDetail = (id) => {
  router.push({
    path: `/lectures/${id}`,
    query: {
      from: 'my',
      year: filter.year,
      semester: filter.semester,
      status: filter.status,
      search: searchInput.value,
      page: state.currentPage,
    },
  });
};

watch(pageSize, () => { state.currentPage = 1; pushQuery() })

// ── watch ─────────────────────────────────────────
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (oldQuery) {
      const oWp = { ...oldQuery }; delete oWp.page;
      const nWp = { ...newQuery }; delete nWp.page;
      if (JSON.stringify(oWp) === JSON.stringify(nWp)) {
        state.currentPage = Number(newQuery.page) || 1;
        fetchList();
        return;
      }
    }
    syncFromQuery(newQuery);
    fetchList();
  },
  { immediate: true, deep: true }
);

// 연도 옵션만 가져오는 함수
const fetchYearOptions = async () => {
  try {
    let res;
    if (isProfessor.value) {
      res = await LectureService.getProfessorLectureYears();
    } else if (isStudent.value) {
      res = await LectureService.getStudentLectureYears();
    } else {
      return;
    }
    const years = Array.isArray(res) ? res : (res.data ?? []);
    const { year: curYear } = getCurrentTerm();
    if (!years.includes(curYear)) years.unshift(curYear);
    yearOptions.value = years;
  } catch (err) {
    console.error('연도 옵션 로드 실패:', err);
    const { year: curYear } = getCurrentTerm();
    yearOptions.value = [curYear];
  }
};

// 초기 진입: query 없으면 기본값 세팅
onMounted(() => {
  fetchYearOptions();
  fetchPeriodStatus();
  if (Object.keys(route.query).length === 0) {
    const { year, semester } = getCurrentTerm();
    router.replace({ path: route.path, query: { year, semester, status: 'APPROVED', page: 1 } });
  }
});
</script>

<template>
  <div style="position: relative;">
    
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <FilterBar
      searchType="search-input"
      :searchList="state.list"
      searchLabelKey="lectureName"
      placeholder="강의명을 입력하세요"
      :showCount="true"
      :count="state.totalCount"
      v-model:pageSize="pageSize"
      @pageSizeChange="() => { state.currentPage = 1 }"
      v-model:searchQuery="searchQuery"
      @search="onSearch"
      @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; state.currentPage = 1; }"
    >
      <div v-if="isProfessor" class="tab-area">
        <button
          v-for="tab in TABS"
          :key="tab"
          :class="['filter-btn', { active: activeTab === tab }]"
          @click="onTabClick(tab)"
        >
          {{ tab }}
        </button>
      </div>
      <div class="filter-item">
        <div class="input-label">연도</div>
        <div class="input-content">
          <select v-model="filter.year" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>
      <div class="filter-item">
        <div class="input-label">학기</div>
        <div class="input-content">
          <select v-model="filter.semester" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="s in semesterOptions" :key="s" :value="s">{{ s }}학기</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <div v-if="isStudent && periodMessage" class="card d-flex ai-center g10">
      <font-awesome-icon icon="fa-solid fa-circle-exclamation" style="color: #3e9e7e;" />
      {{ periodMessage }}
    </div>

    <div v-if="isStudent && modificationNotice" class="card d-flex ai-center g10">
      <font-awesome-icon icon="fa-solid fa-circle-info" style="color: #3e9e7e;" />
      {{ modificationNotice }}
    </div>

    <DataTable
      :columns="tableConfig.cols"
      :rows="state.list"
      :gridCols="tableConfig.grid"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의가 없습니다."
    >
      <article
        class="tbl-row pointer"
        v-for="item in state.list"
        :key="item.lectureId"
        @click="moveToDetail(item.lectureId)"
      >
        <div class="tbl-meta">{{ lectureTypeLabel(item.lectureType) }}</div>
        <div>{{ item.lectureName }}</div>
        <!-- 교수: 전공명 / 학생: 교수명 -->
        <div v-if="isProfessor">{{ item.majorName }}</div>
        <div v-else>{{ item.proName }}</div>
        <div class="pre-line tbl-meta">{{ scheduleText(item.schedules) }}</div>
        <div class="pre-line tbl-meta">{{ roomText(item.schedules) }}</div>
        <div>{{ item.credit }}</div>
        <!-- 교수 추가 컬럼 -->
        <template v-if="isProfessor">
          <div>{{ item.academicYear }}학년</div>
          <div>{{ APPROVAL_STATUS[item.status] || item.status }}</div>
        </template>
      </article>
    </DataTable>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goToPage"
    />

  </div>
</template>

