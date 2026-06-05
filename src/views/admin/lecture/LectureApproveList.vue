<script setup>
import { useAuthStore } from '@/stores/authentication';
import LectureService from '@/services/lectureService';
import { reactive, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Pagination from '@/components/common/Pagination.vue';
import { scheduleText, roomText } from '@/utils/scheduleHelpers';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ── 검색어 ──────────────────────────────────────
const searchQuery = ref('');
const searchInput = ref('');

// ── 탭 ───────────────────────────────────────────
const TABS = ['전체', '대기', '승인', '반려', '폐강'];
const TAB_TO_STATUS = { '대기': 'PENDING', '승인': 'APPROVED', '반려': 'REJECTED', '폐강': 'CANCELLED' };
const STATUS_TO_LABEL = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려', CANCELLED: '폐강' };
const activeTab = ref('대기');

const onTabClick = (tab) => {
  activeTab.value = tab;
  filter.status = TAB_TO_STATUS[tab] || '';
  filter.year = currentYear;
  filter.semester = currentSemester;
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

const currentYear = new Date().getFullYear();
const currentSemester = new Date().getMonth() + 1 >= 3 && new Date().getMonth() + 1 <= 8 ? 1 : 2;
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

const filter = reactive({
  status: '',
  year: currentYear,
  semester: currentSemester,
});

// ── lectureType 한글 변환 ──────────────────────────
const LECTURE_TYPE_LABEL = {
  GENERAL_REQUIRED: '교양필수',
  GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',
  MAJOR_ELECTIVE: '전공선택',
};
const lectureTypeLabel = (code) => LECTURE_TYPE_LABEL[code] || code;

const maxPage = ref(1);

// ── API 호출 ─────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      status: filter.status || undefined,
      lectureName: searchInput.value || undefined,
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      page: state.currentPage,
      size: pageSize.value,
    };
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const res = await LectureService.getAdminLectures(params);
    const page = res.data?? {}; 
    state.list       = page.content ?? [];
    state.totalCount = Number(page.totalElements) ?? 0;
    maxPage.value    = page.totalPages ?? 1;

  } catch (err) {
    console.error('관리자 강의 목록 로드 실패:', err);
    state.list = [];
    state.totalCount = 0;
  } finally {
    state.isLoading = false;
  }
};

// ── URL ↔ 필터 동기화 ──────────────────────────────
const syncFromQuery = (query) => {
  filter.status = 'status' in query ? (query.status || '') : 'PENDING';
  filter.year = query.year ? Number(query.year) : '';
  filter.semester = query.semester ? Number(query.semester) : '';
  searchInput.value = query.search || '';
  searchQuery.value = query.search || '';
  state.currentPage = query.page ? Number(query.page) : 1;
  activeTab.value = STATUS_TO_LABEL[query.status] || '전체';
};

const pushQuery = () => {
  router.push({
    path: route.path,
    query: {
      status: filter.status || '',
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      search: searchInput.value || undefined,
      page: state.currentPage,
    },
  });
};

// ── 검색 (클라이언트 필터) ───────────────────────────
const onSearch = () => {
  searchInput.value = searchQuery.value;
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
    path: `/admin/lectures/${id}`,
    query: {
      from: 'ADMIN',
      status: filter.status,
      year: filter.year || undefined,
      semester: filter.semester || undefined,
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
    // query 없으면 기본값으로 replace
    if (Object.keys(newQuery).length === 0) {
        router.replace({
            path: route.path,
            query: { status: 'PENDING', year: currentYear, semester: currentSemester, page: 1 }
        });
        return;
    }
  syncFromQuery(newQuery);
  fetchList();
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div style="position: relative;">

    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <FilterBar
      searchType="search-input"
      :searchList="state.list"
      searchLabelKey="lectureName"
      placeholder="강의명 또는 교수명"
      :showCount="true"
      :count="state.totalCount"
      :showPageSize="true"
      v-model:pageSize="pageSize"
      :pageSizeOptions="pageSizeOptions"
      @pageSizeChange="() => { state.currentPage = 1 }"
      v-model:searchQuery="searchQuery"
      @search="onSearch"
      @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; }"
    >
      <div class="tab-area">
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
          <select v-model="filter.year" @change="() => { state.currentPage = 1; pushQuery(); }">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>
      <div class="filter-item">
        <div class="input-label">학기</div>
        <div class="input-content">
          <select v-model="filter.semester" @change="() => { state.currentPage = 1; pushQuery(); }">
            <option value="">전체</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="['이수구분', '강의명', '교수명', '전공명', '학점', '강의시간', '강의실', '대상학년', '승인상태']"
      :rows="state.list"
      gridCols="90px 3fr 90px 130px 60px 180px 130px 70px 80px"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의가 없습니다."
    >
      <article
        class="tbl-row pointer"
        v-for="item in state.list"
        :key="item.lectureId"
        @click="moveToDetail(item.lectureId)"
      >
        <div>{{ lectureTypeLabel(item.lectureType) }}</div>
        <div>{{ item.lectureName }}</div>
        <div>{{ item.proName }}</div>
        <div>{{ item.majorName }}</div>
        <div>{{ item.credit }}</div>
        <div class="pre-line">{{ scheduleText(item.schedules) }}</div>
        <div class="pre-line">{{ roomText(item.schedules) }}</div>
        <div>{{ item.academicYear }}학년</div>
        <div>{{ STATUS_TO_LABEL[item.status] || item.status }}</div>
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

