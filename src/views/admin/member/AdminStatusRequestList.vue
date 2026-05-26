<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import codeListService from '@/services/codeService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import TabNav from '@/layouts/common/TabNav.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { APPROVAL_STATUS, STATUS_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ status: '' });

const state = reactive({ list: [], isLoading: false });
const statusOptions = ref([]);

const STATUS_ORDER = Object.keys(APPROVAL_STATUS);
const statusTabs = computed(() => {
  const sorted = [...statusOptions.value].sort(
    (a, b) => STATUS_ORDER.indexOf(a.code) - STATUS_ORDER.indexOf(b.code)
  );
  return [{ code: '', value: '전체' }, ...sorted];
});

const filteredList = computed(() =>
  state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (searchInput.value && !item.studentName?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList);

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllStatusRequests();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('신청서 목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};

const fetchOptions = async () => {
  try {
    const res = await codeListService.getApprovalStatus();
    statusOptions.value = res.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

const hasSearchFilter = computed(() => !!searchInput.value);

const GRID_COLS = 'minmax(90px, 1fr) minmax(70px, 1fr) minmax(90px, 1fr) minmax(80px, 1fr) minmax(120px, 1fr) minmax(70px, 1fr) minmax(70px, 1fr)';

const moveToDetail = (id) => router.push(`/admin/members/status-request/${id}`);

const selectStatus = (code) => {
  filter.status = code;
  onFilterChange();
};

onMounted(() => {
  fetchOptions();
  fetchList();
  if (!filter.status) {
    filter.status = 'PENDING';
    onFilterChange();
  }
});
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <TabNav />

    <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasSearchFilter"
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
      :columns="['학번', '이름', '학년/학기', '신청 유형', '신청일자', '처리자', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 신청서가 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.requestId"
               @click="moveToDetail(item.requestId)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.studentName }}</div>
        <div>{{ item.academicYear }}학년 {{ item.semester }}학기</div>
        <div>{{ STATUS_REQUEST_TYPE[item.type] ?? item.type }}</div>
        <div>{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.updaterName ?? '-' }}</div>
        <div>{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>

<style scoped>
.tbl-row { cursor: pointer; }
</style>
