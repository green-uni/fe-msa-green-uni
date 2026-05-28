<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import codeListService from '@/services/codeService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import TabNav from '@/layouts/common/TabNav.vue'
import { formatTel } from '@/utils/phoneNumber';
import { STATUS_LABEL } from '@/utils/constants';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ status: '' })

// ── 반응형 상태 ──────────────────────────────────
const state = reactive({ list: [], isLoading: false })

// ── 드롭다운 옵션 ─────────────────────────────────
const statusOptions = ref([]);

// ── computed ─────────────────────────────────────
const filteredList = computed(() =>
  state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (searchInput.value && !item.name?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList)

// ── API ──────────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAdmins();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};
const fetchOptions = async () => {
  try {
    const [statusRes] = await Promise.all([codeListService.getAdminStatusList()])
    statusOptions.value = statusRes.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

const GRID_COLS = '120px 150px 1fr 1fr 90px'

const moveToDetail = (id) => router.push(`/admin/members/${id}`)

onMounted(() => { fetchOptions(); fetchList() })
</script>

<template>
  <div style="position: relative;">
    <TabNav />
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasFilter"
              @search="onSearch" @reset="resetFilter"
              :showCount="true" :count="filteredList.length"
              :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
              @pageSizeChange="onPageSizeChange">
      <div class="filter-item">
        <div class="input-label">상태</div>
        <div class="input-content">
          <select v-model="filter.status" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="s in statusOptions" :key="s.code" :value="s.code">{{ s.value }}</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="['학번', '이름', '이메일', '전화번호', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 관리자가 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.memberCode"
              @click="moveToDetail(item.memberCode)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.name }}</div>
        <div>{{ item.email }}</div>
        <div>{{ formatTel(item.tel) }}</div>
        <div>{{ STATUS_LABEL.ADMIN[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>

<style scoped lang="scss">
.tbl-row { cursor: pointer; }
</style>
