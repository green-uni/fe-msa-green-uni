<script setup>
import LectureService from '@/services/lectureService';
import { onMounted, reactive, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import SearchInput from '@/components/util/SearchInput.vue';

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
const PAGE_SIZE = 10;

const state = reactive({
  list: [],
  totalCount: 0,
  isLoading: false,
  currentPage: 1,
});

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

// ── schedule 표시용 헬퍼 ──────────────────────────
const scheduleText = (schedules) => {
  if (!schedules || schedules.length === 0) return '-';
  return schedules
    .map(s => `${s.dayOfWeek} ${s.startPeriod}~${s.endPeriod}교시`)
    .join(',\n');
};

const roomText = (schedules) => {
  if (!schedules || schedules.length === 0) return '-';
  // 강의실이 모두 같으면 하나만, 다르면 첫 번째만 표시
  const rooms = [...new Set(schedules.map(s => `${s.building ?? ''} ${s.room ?? ''}`.trim()))];
  return rooms.join(',\n');
};

// ── 최대 페이지 ───────────────────────────────────
const maxPage = computed(() => {
  return Math.ceil(state.totalCount / PAGE_SIZE) || 1;
});

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
      size: PAGE_SIZE,
      startIdx: (state.currentPage - 1) * PAGE_SIZE, 
    };
    // 빈 값 제거
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const res = await LectureService.getAllLectures(params);
    const data = res.data || [];
    state.list = data;
    state.totalCount = data[0]?.totalCount ?? 0;


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
  router.push({
    path: `/lectures/${id}`,
    query: {
      from: 'ALL',
      year: filter.year,
      semester: filter.semester,
      search: searchInput.value,
      page: state.currentPage,
    },
  });
};

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
    const res = await LectureService.getAllLectures({ 
      page: 1, size: 9999, startIdx: 0 
    });
    const data = res.data || [];
    const years = [...new Set(data.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
    yearOptions.value = years;
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
  <div class="container">

    <!-- 필터 헤더 -->
    <div class="filter-header">
      <div class="filter-group">

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

      </div>

      <div class="search-area">
        <div class="input-content">
          <SearchInput
            v-model="searchQuery"
            :list="state.list"
            :realtime="false"
            labelKey="lectureName"
            placeholder="강의명 또는 교수명 검색"
            @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; state.currentPage = 1; }"
            @enter="onSearch"
          />
        </div>
        <button class="btn search-btn" @click="onSearch">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
        </button>
      </div>
    </div>

    <!-- 건수 -->
    <div class="data-header">
      전체: {{ state.totalCount }}건
    </div>

    <!-- 테이블 -->
    <DataTable
      :columns="['이수구분', '전공명', '강의명', '교수명', '강의시간', '강의실', '학점', '대상학년']"
      :rows="state.list"
      gridCols="90px 150px 3fr 90px 180px 150px 60px 70px"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의가 없습니다."
    >
      <article
        class="tbl-row"
        v-for="item in state.list"
        :key="item.lectureId"
        @click="moveToDetail(item.lectureId)"
      >
        <div>{{ lectureTypeLabel(item.lectureType) }}</div>
        <div>{{ item.majorName }}</div>
        <div>{{ item.lectureName }}</div>
        <div>{{ item.proName }}</div>
        <div style="white-space: pre-line;">{{ scheduleText(item.schedules) }}</div>
        <div style="white-space: pre-line;">{{ roomText(item.schedules) }}</div>
        <div>{{ item.credit }}</div>
        <div>{{ item.academicYear }}학년</div>
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

<style scoped>
.tbl-row {
  cursor: pointer;
  display: grid;
  grid-template-columns: 90px 150px 3fr 90px 180px 150px 60px 70px;
  align-items: center;
  text-align: center;
}
</style>