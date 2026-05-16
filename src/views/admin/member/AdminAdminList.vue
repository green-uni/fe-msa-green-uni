<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import codeListService from '@/services/codeService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import SearchInput from '@/components/util/SearchInput.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { formatTel } from '@/utils/phoneNumber';
import { STATUS_LABEL, POSITION_LABEL } from '@/utils/constants';

const route = useRoute();
const router = useRouter();

// ── 페이지 설정 ──────────────────────────────────
const pageSize = ref(10);
const pageSizeOptions = [10, 20, 50];

// ── 반응형 상태 ──────────────────────────────────
const state = reactive({
  list: [],
  isLoading: false,
  currentPage: 1,
});
const searchQuery = ref('');  // 입력창 바인딩 (타이핑마다 갱신)
const searchInput = ref('');  // 확정된 검색어 (엔터/버튼 클릭 시)

// ── 드롭다운 옵션 ─────────────────────────────────
const statusOptions = ref([]);

// ── 필터 ────────────────────────────────────────
const filter = reactive({
  status: ''
});

// ── computed ─────────────────────────────────────
const filteredList = computed(() => {  // 전체 필터 조건 적용
  return state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (searchInput.value && !item.name?.includes(searchInput.value)) return false;
    return true;
  });
});
const pagedList = computed(() => {  // 현재 페이지 슬라이스
  const start = (state.currentPage - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});
const hasFilter = computed(() =>  // 초기화 버튼 노출 여부
  filter.status || filter.majorName || filter.position || searchInput.value
);
const maxPage = computed(() =>  // 최대 페이지 수
  Math.ceil(filteredList.value.length / pageSize.value) || 1
);

// ── API ──────────────────────────────────────────
const fetchList = async () => { // 목록 전체 로드 (초기 1회)
  state.isLoading = true;
  try {
    const res = await MemberService.findAdmins();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
    state.list = [];
  } finally {
    state.isLoading = false;
  }
};
const fetchOptions = async () => {  // 드롭다운 옵션 로드
  try {
    const [statusRes] = await Promise.all([
      codeListService.getAdminStatusList()
    ]);
    statusOptions.value = statusRes.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

// ── URL 동기화 ────────────────────────────────────
const syncFromQuery = (query) => {  // URL → 필터 상태 반영
  filter.status = query.status || '';
  searchInput.value = query.search || '';
  searchQuery.value = query.search || '';
  state.currentPage = query.page ? Number(query.page) : 1;
};

// ── 이벤트 핸들러 ─────────────────────────────────
const onSearch = () => {  // 검색 실행
  searchInput.value = searchQuery.value;
  state.currentPage = 1;
  pushQuery();
};
const onFilterChange = () => { // 일반 필터 변경
  state.currentPage = 1;
  pushQuery();
};
const onPageSizeChange = () => { // 페이지 크기 변경
  state.currentPage = 1;
};
const resetFilter = () => { // 전체 필터 초기화
  filter.status = '';
  searchInput.value = '';
  searchQuery.value = '';
  state.currentPage = 1;
  router.push({ path: route.path });
};
const goToPage = (page) => { // 페이지 이동
  state.currentPage = page;
  router.push({ path: route.path, query: { ...route.query, page } });
};
const moveToDetail = (id) => { // 상세 페이지 이동
  router.push({ path: `/admin/members/${id}` });
};
const pushQuery = () => { // 필터 상태 → URL 반영
  router.push({
    path: route.path,
    query: {
      status: filter.status || undefined,
      search: searchInput.value || undefined,
      page: state.currentPage,
    },
  });
};

// ── watch ─────────────────────────────────────────
watch(
  () => route.query,
  (newQuery) => syncFromQuery(newQuery),
  { immediate: true, deep: true },
);

// ── 라이프사이클 ──────────────────────────────────
onMounted(() => {
  fetchOptions();
  fetchList();
});
</script>

<template>
  <div class="container" style="position: relative;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <!-- 필터 헤더 -->
    <div class="filter-header">
      <div class="filter-group">

        <div class="filter-item">
          <div class="input-label">상태</div>
          <div class="input-content">
            <select v-model="filter.status" @change="onFilterChange">
              <option value="">전체</option>
              <option v-for="s in statusOptions" :key="s.code" :value="s.code">{{ s.value }}</option>
            </select>
          </div>
        </div>

      </div>
      <button v-if="hasFilter" class="btn" @click="resetFilter">초기화</button>

      <div class="search-area">
        <div class="input-content">
          <SearchInput
            v-model="searchQuery"
            :list="state.list"
            :realtime="false"
            labelKey="name"
            placeholder="이름 검색"
            @select="(item) => { searchInput = item.name; searchQuery = item.name; state.currentPage = 1; }"
            @enter="onSearch"
          />
        </div>
        <button class="btn search-btn" @click="onSearch">
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
        </button>
      </div>
    </div>

    <div class="data-header">
      전체: {{ filteredList.length }}건
      <select v-model="pageSize" @change="onPageSizeChange">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}개</option>
      </select>
    </div>

    <DataTable
      :columns="['학번', '이름', '이메일', '전화번호', '상태']"
      :rows="pagedList"
      gridCols="1fr 1fr 1fr 1fr 1fr"
      :isLoading="state.isLoading"
      emptyMessage="조회된 관리자가 없습니다."
    >
      <article
        class="tbl-row"
        v-for="item in pagedList"
        :key="item.memberCode"
        @click="moveToDetail(item.memberCode)"
      >
        <div>{{ item.memberCode }}</div>
        <div>{{ item.name }}</div>
        <div>{{ item.email }}</div>
        <div>{{ formatTel(item.tel) }}</div>
        <div>{{ STATUS_LABEL.PROFESSOR[item.status] ?? item.status }}</div>
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

<style scoped lang="scss">
.tbl-row {
  cursor: pointer;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  align-items: center;
  text-align: center;
}
</style>
