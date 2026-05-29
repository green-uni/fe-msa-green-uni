<script setup>
import { reactive, computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
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

const route = useRoute();
const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange,
} = useListFilter({ status: '', academicYear: 0, majorName: '', collegeName: '' })

const state = reactive({ list: [], isLoading: false })
const maxPage = ref(1)
const totalCount = ref(0)

const collegeOptions = ref([]);
const majorOptions = ref([]);
const statusOptions = ref([]);
const academicYearOptions = [1, 2, 3, 4];

// 단과대 선택 시 해당 단과대 전공만 표시
const filteredMajorOptions = computed(() =>
  filter.collegeName
    ? majorOptions.value.filter(m => m.collegeName === filter.collegeName)
    : majorOptions.value
);

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findStudents({
      status: filter.status || undefined,
      collegeName: filter.collegeName || undefined,
      majorName: filter.majorName || undefined,
      academicYear: filter.academicYear || undefined,
      search: searchInput.value || undefined,
      page: currentPage.value,
      size: pageSize.value,
    });
    state.list = res.data.content ?? [];
    maxPage.value = res.data.totalPages ?? 1;
    totalCount.value = res.data.totalElements ?? 0;
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

const GRID_COLS = '100px 150px 170px 1fr 1fr 90px 90px'

const onCollegeChange = () => { filter.majorName = ''; onFilterChange() }
const moveToDetail = (id) => router.push(`/admin/members/${id}`)

watch(() => route.query, fetchList, { immediate: false })
watch(pageSize, fetchList, { immediate: false })

onBeforeRouteLeave((to) => {
  // 회원 상세 프로필 이동은 필터 유지, 다른 페이지로 이동 시 초기화
  if (!to.params.memberCode) {
    sessionStorage.removeItem(`listFilter:${route.path}`)
  }
})

onMounted(() => {
  fetchOptions()
  const hasUrlQuery = Object.keys(route.query).length > 0
  const stored = sessionStorage.getItem(`listFilter:${route.path}`)

  if (hasUrlQuery || !stored) {
    // URL에 query가 있으면 useListFilter가 이미 filter 값 sync 완료 → 바로 fetchList.
    // URL도 없고 sessionStorage도 없으면 기본(전체) 조회.
    fetchList()
  }
  // stored가 있고 URL이 비어있으면 useListFilter가 router.replace로 복원,
  // route.query watch가 fetchList를 호출
})
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />
    <TabNav />
    <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasFilter"
              @search="onSearch" @reset="resetFilter"
              :showCount="true" :count="totalCount"
              :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
              @pageSizeChange="onPageSizeChange">
      <div class="filter-item">
        <label>단과대</label>
        <select v-model="filter.collegeName" @change="onCollegeChange">
          <option value="">전체</option>
          <option v-for="c in collegeOptions" :key="c.collegeId" :value="c.name">{{ c.name }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>전공</label>
        <select v-model="filter.majorName" @change="onFilterChange">
          <option value="">전체</option>
          <option v-for="m in filteredMajorOptions" :key="m.majorId" :value="m.name">{{ m.name }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>학년</label>
        <select v-model="filter.academicYear" @change="onFilterChange">
          <option value="">전체</option>
          <option v-for="y in academicYearOptions" :key="y" :value="y">{{ y }}학년</option>
        </select>
      </div>
      <div class="filter-item">
        <label>상태</label>
        <select v-model="filter.status" @change="onFilterChange">
          <option value="">전체</option>
          <option v-for="s in statusOptions" :key="s.code" :value="s.code">{{ s.value }}</option>
        </select>
      </div>
    </FilterBar>

    <DataTable
      :columns="['학번', '이름', '전공', '이메일', '전화번호', '학년', '상태']"
      :rows="state.list"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 학생이 없습니다."
    >
      <article class="tbl-row pointer" v-for="item in state.list" :key="item.memberCode"
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
