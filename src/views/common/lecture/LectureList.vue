<script setup>
import LectureService from '@/services/lectureService';
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Pagination from '@/components/common/Pagination.vue';
import { useAuthStore } from '@/stores/authentication';
import { scheduleText, roomText } from '@/utils/scheduleHelpers';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

// ── 검색어 ──────────────────────────────────────
const searchQuery = ref('');   // 입력창 바인딩 (타이핑마다)
const searchInput = ref('');   // 실제 검색에 사용 (엔터/버튼 클릭 시만)

// ── 현재 학기 계산 ───────────────────────────────
const getCurrentTerm = () => {
  const now = new Date();
  const year = now.getFullYear();
  const semester = (now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8) ? 1 : 2;
  return { year, semester };
};

// ── 상태 ────────────────────────────────────────
const pageSize = ref(10)
const pageSizeOptions = [10, 20, 30]

const state = reactive({
  list: [],
  currentPage: 1,
  totalCount: 0,
  isLoading: false,
});

const maxPage = ref(1);

// 필터: 서버로 보낼 파라미터
const filter = reactive({
  year: '',
  semester: '',
  lectureName: '',
  proName: '',
  majorId: '',
});

// 필터 드롭다운용 옵션 (클라이언트에서 수집)
const yearOptions = ref([]);
const semesterOptions = [1, 2];

// ── lectureType 한글 변환 ──────────────────────────
const LECTURE_TYPE_LABEL = {
  GENERAL_REQUIRED: '교양필수',
  GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',
  MAJOR_ELECTIVE: '전공선택',
};
const lectureTypeLabel = (code) => LECTURE_TYPE_LABEL[code] || code;



// ── API 호출 ─────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      lectureName: searchInput.value || undefined,
      proName: searchInput.value || undefined,
      majorId: filter.majorId || undefined,
      page: state.currentPage,
      size: pageSize.value,
    };
    // 빈 값 제거
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const res = await LectureService.getAllLectures(params);
    const page = res.data ?? {};
    state.list       = page.content ?? [];
    state.totalCount = Number(page.totalElements ?? 0);
    maxPage.value    = page.totalPages ?? 1;


  } catch (err) {
    console.error('전체 강의 목록 로드 실패:', err);
    state.list = [];
    state.totalCount = 0;
  } finally {
    state.isLoading = false;
  }
};

// ── URL ↔ 필터 동기화 ──────────────────────────────
const syncFromQuery = (query) => {
  const { year: curYear, semester: curSemester } = getCurrentTerm();
  filter.year = query.year ? Number(query.year) : (yearOptions.value[0] || curYear);
  filter.semester = query.semester ? Number(query.semester) : curSemester;
  filter.majorId = query.majorId || '';
  searchInput.value = query.search || '';
  searchQuery.value = query.search || '';
  state.currentPage = query.page ? Number(query.page) : 1;
};

const pushQuery = () => {
  router.push({
    path: route.path,
    query: {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      majorId: filter.majorId || undefined,
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
  const basePath = authStore.role === 'ADMIN' ? '/admin/lectures' : '/lectures';
  router.push({
    path: `${basePath}/${id}`,
    query: {
      from: 'ALL',
      year: filter.year,
      semester: filter.semester,
      search: searchInput.value,
      page: state.currentPage,
    },
  });
};

watch(pageSize, () => { state.currentPage = 1; pushQuery() })

// ── watch: query 변경 시 fetch ─────────────────────
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    // 페이지만 바뀐 경우
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
    const res = await LectureService.getLectureYears();
    yearOptions.value = res ?? [];
  } catch (err) {
    console.error('연도 옵션 로드 실패:', err);
  }
};

// ── 초기 진입: query 없으면 기본값 세팅 ────────────
onMounted(() => {
  fetchYearOptions();
  if (Object.keys(route.query).length === 0) {
    const { year, semester } = getCurrentTerm();
    router.replace({
      path: route.path,
      query: { year, semester, page: 1 },
    });
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
      placeholder="강의명 또는 교수명 검색"
      :showCount="true"
      :count="state.totalCount"
      v-model:pageSize="pageSize"
      @pageSizeChange="() => { state.currentPage = 1 }"
      v-model:searchQuery="searchQuery"
      @search="onSearch"
      @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; state.currentPage = 1; }"
    >
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

    <!-- 테이블 -->
    <DataTable
      :columns="['이수구분', '전공명', '강의명', '교수명', '강의시간', '강의실', '학점', '대상학년']"
      :rows="state.list"
      gridCols="minmax(90px, 0.5fr) 150px minmax(200px, 3fr) minmax(90px, 0.5fr) 180px 150px minmax(60px, 0.5fr) minmax(70px, 0.5fr)"
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
        <div>{{ item.majorName }}</div>
        <div>{{ item.lectureName }}</div>
        <div>{{ item.proName }}</div>
        <div class="pre-line tbl-meta">{{ scheduleText(item.schedules) }}</div>
        <div class="pre-line tbl-meta">{{ roomText(item.schedules) }}</div>
        <div>{{ item.credit }}</div>
        <div class="tbl-meta">{{ item.academicYear }}학년</div>
      </article>
    </DataTable>

    <!-- 페이지네이션 -->
    <Pagination
      :currentPage="state.currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goToPage"
    />

  </div>
</template>
