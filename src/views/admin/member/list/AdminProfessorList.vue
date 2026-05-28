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
import { formatTel } from '@/utils/phoneNumber';
import { STATUS_LABEL, POSITION_LABEL } from '@/utils/constants';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ status: '', majorName: '', position: '' })

// ── 반응형 상태 ──────────────────────────────────
const state = reactive({ list: [], isLoading: false })

// ── 드롭다운 옵션 ─────────────────────────────────
const positionOptions = ref([]);
const majorOptions = ref([]);
const statusOptions = ref([]);

// ── computed ─────────────────────────────────────
const filteredList = computed(() =>
  state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (filter.position && item.position !== filter.position) return false;
    if (filter.majorName && item.majorName !== filter.majorName) return false;
    if (searchInput.value && !item.name?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList)

// ── API ──────────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findProfessors();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};
const fetchOptions = async () => {
  try {
    const [statusRes, positionRes, majorRes] = await Promise.all([
      codeListService.getProfessorStatusList(),
      codeListService.getProfessorPositionList(),
      MemberService.getMajorList()
    ]);
    statusOptions.value = statusRes.data ?? [];
    majorOptions.value = majorRes.data ?? [];
    positionOptions.value = positionRes.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

const GRID_COLS = '120px 150px 120px 1fr 1fr 90px 90px'

const moveToDetail = (id) => router.push(`/admin/members/${id}`)

onMounted(() => { fetchOptions(); fetchList() })
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
      <div class="filter-item">
        <div class="input-label">전공</div>
        <div class="input-content">
          <select v-model="filter.majorName" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="m in majorOptions" :key="m.majorId" :value="m.name">{{ m.name }}</option>
          </select>
        </div>
      </div>
      <div class="filter-item">
        <div class="input-label">직위</div>
        <div class="input-content">
          <select v-model="filter.position" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="s in positionOptions" :key="s.code" :value="s.code">{{ s.value }}</option>
          </select>
        </div>
      </div>
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
      :columns="['교번', '이름', '전공', '이메일', '전화번호', '직위', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 교수가 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.memberCode"
              @click="moveToDetail(item.memberCode)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.name }}</div>
        <div>{{ item.majorName }}</div>
        <div>{{ item.email }}</div>
        <div>{{ formatTel(item.tel) }}</div>
        <div>{{ POSITION_LABEL[item.position] }}</div>
        <div>{{ STATUS_LABEL.PROFESSOR[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>

<style scoped lang="scss">
.tbl-row { cursor: pointer; }
</style>
