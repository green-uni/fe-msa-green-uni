<script setup>
import { useAuthStore } from '@/stores/authentication';
import LectureService from '@/services/lectureService';
import { reactive, onMounted, computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import SearchInput from '@/components/util/SearchInput.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ── 검색어 ──────────────────────────────────────
const searchQuery = ref('');
const searchInput = ref('');

// ── 탭 ───────────────────────────────────────────
const TABS = ['전체', '대기', '승인', '반려'];
const TAB_TO_STATUS = { '대기': 'PENDING', '승인': 'APPROVED', '반려': 'REJECTED' };
const STATUS_TO_LABEL = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' };
const activeTab = ref('전체');

const onTabClick = (tab) => {
  activeTab.value = tab;
  filter.status = TAB_TO_STATUS[tab] || '';
  state.currentPage = 1;
  pushQuery();
};

// ── 상태 ────────────────────────────────────────
const PAGE_SIZE = 10;

const state = reactive({
  list: [],
  totalCount: 0,
  isLoading: false,
  currentPage: 1,
});

const filter = reactive({
  status: '',
});

// ── lectureType 한글 변환 ──────────────────────────
const LECTURE_TYPE_LABEL = {
  GENERAL_REQUIRED: '교양필수',
  GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',
  MAJOR_ELECTIVE: '전공선택',
};
const lectureTypeLabel = (code) => LECTURE_TYPE_LABEL[code] || code;

// ── schedule 헬퍼 ─────────────────────────────────
const scheduleText = (schedules) => {
  if (!schedules?.length) return '-';
  return schedules.map(s => `${s.dayOfWeek} ${s.startPeriod}~${s.endPeriod}교시`).join(',\n');
};
const roomText = (schedules) => {
  if (!schedules?.length) return '-';
  const rooms = [...new Set(schedules.map(s => `${s.building ?? ''} ${s.room ?? ''}`.trim()))];
  return rooms.join(',\n');
};

// ── 최대 페이지 ───────────────────────────────────
const maxPage = computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1);

// ── 클라이언트 측 강의명 검색 필터 (서버 params에 없으므로 프론트에서 처리) ──
const filteredList = computed(() => {
  if (!searchInput.value) return state.list;
  const kw = searchInput.value.toLowerCase();
  return state.list.filter(i =>
    i.lectureName?.toLowerCase().includes(kw) ||
    i.proName?.toLowerCase().includes(kw)
  );
});

// ── API 호출 ─────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      status: filter.status || undefined,
      page: state.currentPage,
      size: PAGE_SIZE,
      startIdx: (state.currentPage - 1) * PAGE_SIZE,
    };
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    const res = await LectureService.getAdminLectures(params);
    const data = res.data || [];
    state.list = data;
    state.totalCount = data[0]?.totalCount ?? 0;

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
  // status 키가 URL에 존재하면 그 값 사용, 없으면 PENDING (초기 기본값)
  filter.status = 'status' in query ? (query.status || '') : 'PENDING';
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
      search: searchInput.value || undefined,
      page: state.currentPage,
    },
  });
};

// ── 검색 (클라이언트 필터) ───────────────────────────
const onSearch = () => {
  searchInput.value = searchQuery.value;
  state.currentPage = 1;
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
      from: 'admin',
      status: filter.status,
      search: searchInput.value,
      page: state.currentPage,
    },
  });
};

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
            query: { status: 'PENDING', page: 1 }
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
  <div class="container">

    <div class="filter-header">
      <!-- 탭 -->
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

      <!-- 검색 -->
      <div class="search-area input-content">
        <SearchInput
          v-model="searchQuery"
          :list="state.list"
          labelKey="lectureName"
          :realtime="false"
          placeholder="강의명 또는 교수명"
          @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; }"
          @enter="onSearch"
        />
        <button class="btn search-btn" @click="onSearch">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
        </button>
      </div>
    </div>

    <div class="data-header">
      전체: {{ state.totalCount }}건
    </div>

    <DataTable
      :columns="['이수구분', '강의명', '교수명', '전공명', '학점', '강의시간', '강의실', '대상학년', '승인상태']"
      :rows="filteredList"
      gridCols="90px 3fr 90px 130px 60px 180px 130px 70px 80px"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의가 없습니다."
    >
      <article
        class="tbl-row"
        v-for="item in filteredList"
        :key="item.lectureId"
        @click="moveToDetail(item.lectureId)"
      >
        <div>{{ lectureTypeLabel(item.lectureType) }}</div>
        <div>{{ item.lectureName }}</div>
        <div>{{ item.proName }}</div>
        <div>{{ item.majorName }}</div>
        <div>{{ item.credit }}</div>
        <div style="white-space: pre-line;">{{ scheduleText(item.schedules) }}</div>
        <div style="white-space: pre-line;">{{ roomText(item.schedules) }}</div>
        <div>{{ item.academicYear }}학년</div>
        <div>
          <span :class="['status-badge', item.status]">
            {{ STATUS_TO_LABEL[item.status] || item.status }}   
          </span>
        </div>
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

<style scoped>
.tbl-row { 
  cursor: pointer;
  display: grid;
  grid-template-columns: 90px 3fr 90px 130px 60px 180px 130px 70px 80px;
  align-items: center;
  text-align: center;
}

.status-badge {
  position: static !important;
  transform: none !important;
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}
.status-badge.PENDING  { background: #fff3e0; color: #ef6c00; }
.status-badge.REJECTED { background: #ffebee; color: #c62828; }
.status-badge.APPROVED { background: #eafdf6; color: #3e9e7e; }
</style>