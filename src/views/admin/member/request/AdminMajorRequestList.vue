<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import codeListService from '@/services/codeService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import TabNav from '@/layouts/common/TabNav.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ status: '' })

// ── 반응형 상태 ──────────────────────────────────
const state = reactive({ list: [], isLoading: false })

// ── 필터 옵션 ─────────────────────────────────
const statusOptions = ref([]);

// ── 상태 탭 (전체 + PENDING 우선 정렬) ───────────
const STATUS_ORDER = Object.keys(APPROVAL_STATUS)
const statusTabs = computed(() => {
  const sorted = [...statusOptions.value].sort(
    (a, b) => STATUS_ORDER.indexOf(a.code) - STATUS_ORDER.indexOf(b.code)
  )
  return [{ code: '', value: '전체' }, ...sorted]
})

// ── computed ─────────────────────────────────────
const filteredList = computed(() =>
  state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (searchInput.value && !item.studentName?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList)

// ── API ──────────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllMajorRequests();
      state.list = res.data ?? [];
  } catch (err) {
    console.error('신청서 목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};
const fetchOptions = async () => {
  try {
    const [approvalStatusRes] = await Promise.all([
      codeListService.getApprovalStatus(),
    ]);
    statusOptions.value = approvalStatusRes.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

// ── 이벤트 핸들러 ─────────────────────────────────
const GRID_COLS = '100px 90px 150px 90px 1fr 110px 110px 80px'

const moveToDetail = (id) => router.push(`/admin/members/major-request/${id}`)

const selectStatus = (code) => {
  filter.status = code
  onFilterChange()
}

onMounted(() => {
  fetchOptions()
  fetchList()
  if (!filter.status) {
    filter.status = 'PENDING'
    onFilterChange()
  }
})
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <TabNav />

    <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasFilter"
              @search="onSearch" @reset="resetFilter"
              :showCount="true" :count="filteredList.length"
              :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
              @pageSizeChange="onPageSizeChange">
      <div class="tab-area">
        <button
          v-for="tab in statusTabs"
          :key="tab.code"
          :class="['filter-btn', { active: filter.status === tab.code }]"
          @click="selectStatus(tab.code)"
        >
          {{ tab.value }}
        </button>
      </div>
    </FilterBar>

    <DataTable
      :columns="['학번', '이름', '현재 학과', '신청 유형', '신청 학과', '신청일자', '처리자', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 신청서가 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.memberCode"
               @click="moveToDetail(item.requestId)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.studentName }}</div>
        <div>{{ item.currentMajorName }} <template v-if="item.currentMinorName">/ {{ item.currentMinorName }}</template></div>
        <div>{{ MAJOR_REQUEST_TYPE[item.type] ?? item.type }}</div>
        <div>{{ item.targetMajorName }}</div>
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.updaterName ?? '-' }}</div>
        <div>{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>

<style scoped lang="scss">
.tbl-row { cursor: pointer; }
</style>
