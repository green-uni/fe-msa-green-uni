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
import { STATUS_LABEL } from '@/utils/constants';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ status: '', academicYear: 0, majorName: '', collegeName: '' })

// ── 반응형 상태 ──────────────────────────────────
const state = reactive({ list: [], isLoading: false })

// ── 드롭다운 옵션 ─────────────────────────────────
const collegeOptions = ref([]);
const majorOptions = ref([]);
const statusOptions = ref([]);
const academicYearOptions = [1, 2, 3, 4];

// ── computed ─────────────────────────────────────
const filteredList = computed(() =>
  state.list.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (filter.academicYear && String(item.academicYear) !== String(filter.academicYear)) return false;
    if (filter.majorName && item.majorName !== filter.majorName) return false;
    if (filter.collegeName && item.college !== filter.collegeName) return false;
    if (searchInput.value && !item.name?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList)

const filteredMajorOptions = computed(() =>
  filter.collegeName
    ? majorOptions.value.filter(m => m.collegeName === filter.collegeName)
    : majorOptions.value
);

// ── API ──────────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findStudents();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('학생 목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};
const fetchOptions = async () => {
  try {
    const [statusRes, majorRes, collegeRes] = await Promise.all([
      codeListService.getStudentStatusList(),
      MemberService.getMajorList(),
      MemberService.getCollegeList()
    ]);
    statusOptions.value = statusRes.data ?? [];
    majorOptions.value = majorRes.data ?? [];
    collegeOptions.value = collegeRes.data ?? [];
  } catch (err) {
    console.error('옵션 로드 실패:', err);
  }
};

// ── 이벤트 핸들러 ─────────────────────────────────
const GRID_COLS = '100px 150px 170px 1fr 1fr 90px 90px'

const onCollegeChange = () => { filter.majorName = ''; onFilterChange() }
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
        <div class="input-label">단과대</div>
        <div class="input-content">
          <select v-model="filter.collegeName" @change="onCollegeChange">
            <option value="">전체</option>
            <option v-for="c in collegeOptions" :key="c.collegeId" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <div class="filter-item">
        <div class="input-label">전공</div>
        <div class="input-content">
          <select v-model="filter.majorName" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="m in filteredMajorOptions" :key="m.majorId" :value="m.name">{{ m.name }}</option>
          </select>
        </div>
      </div>
      <div class="filter-item">
        <div class="input-label">학년</div>
        <div class="input-content">
          <select v-model="filter.academicYear" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="y in academicYearOptions" :key="y" :value="y">{{ y }}학년</option>
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
      :columns="['학번', '이름', '전공', '이메일', '전화번호', '학년', '상태']"
      :rows="pagedList"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 학생이 없습니다."
    >
      <article class="tbl-row" v-for="item in pagedList" :key="item.memberCode"
               @click="moveToDetail(item.memberCode)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.name }}</div>
        <div>{{ item.majorName }}</div>
        <div>{{ item.email }}</div>
        <div>{{ formatTel(item.tel) }}</div>
        <div>{{ item.academicYear }}학년</div>
        <div>{{ STATUS_LABEL.STUDENT[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>

<style scoped lang="scss">
.tbl-row { cursor: pointer; }
</style>
