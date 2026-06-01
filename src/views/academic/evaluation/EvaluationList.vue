<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import evaluationService from '@/services/evaluationService';
import DataTable from '@/components/common/DataTable.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Pagination from '@/components/common/Pagination.vue';

const yearOptions = ref([]);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const role = computed(() => authStore.role);

const PAGE_SIZE = 10;

const getCurrentTerm = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    semester: now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8 ? 1 : 2,
  };
};

const filter = reactive({
  year: route.query.year ? Number(route.query.year) : getCurrentTerm().year,
  semester: route.query.semester ? Number(route.query.semester) : getCurrentTerm().semester,
});

const state = reactive({
  list: [],
  currentPage: 1,
  totalCount: 0,
  isLoading: false,
});

const maxPage = computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1);

const tableCols = computed(() =>
  role.value === 'STUDENT'
    ? ['강의명', '교수명', '평가기간', '상태']
    : ['강의명', '평가기간', '상태']
);
const gridCols = computed(() =>
  role.value === 'STUDENT' ? '1fr 130px 220px 110px' : '1fr 220px 110px'
);

const fetchYearOptions = async () => {
  const curYear = getCurrentTerm().year;
  try {
    const res = role.value === 'STUDENT'
      ? await evaluationService.getStudentEvalYears()
      : await evaluationService.getProfessorEvalYears();
    const years = res.data ?? [];
    if (!years.includes(curYear)) years.unshift(curYear);
    yearOptions.value = years;
  } catch {
    yearOptions.value = [curYear];
  }
};

const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      page: state.currentPage,
      size: PAGE_SIZE,
    };
    const res = role.value === 'STUDENT'
      ? await evaluationService.getStudentEvalList(params)
      : await evaluationService.getProfessorEvalList(params);
    state.list = res.data ?? [];
    state.totalCount = state.list.length;
  } catch (e) {
    console.error(e);
    state.list = [];
  } finally {
    state.isLoading = false;
  }
};

const onFilterChange = () => {
  state.currentPage = 1;
  fetchList();
};

const goToPage = (page) => {
  state.currentPage = page;
  fetchList();
};

const formatDate = (dt) => dt ? dt.slice(0, 10) : '-';
const formatPeriod = (item) =>
  item.startDate && item.endDate
    ? `${formatDate(item.startDate)} ~ ${formatDate(item.endDate)}`
    : '-';

const getEvalStatus = (item) => {
  const today = new Date();
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  if (!start || !end || today < start) return 'before';
  if (today > end) return 'done';
  return 'active';
};

const getStudentBadge = (item) => {
  const status = getEvalStatus(item);
  if (status === 'before') return { label: '강의진행중', cls: 'before' };
  if (status === 'active') return item.isEvaluated
    ? { label: '완료', cls: 'done' }
    : { label: '미작성', cls: 'pending' };
  return item.isEvaluated
    ? { label: '완료', cls: 'done' }
    : { label: '만료', cls: 'expired' };
};

const getProfessorBadge = (item) => {
  const status = getEvalStatus(item);
  if (status === 'before') return { label: '강의진행중', cls: 'before' };
  if (status === 'active') return { label: '진행중', cls: 'pending' };
  return { label: '평가완료', cls: 'done' };
};

const getBadge = (item) =>
  role.value === 'STUDENT' ? getStudentBadge(item) : getProfessorBadge(item);

const moveToDetail = (item) => {
  router.push({ path: `/evaluations/${item.lectureId}`, state: { listItem: item } });
};

onMounted(() => {
  fetchYearOptions();
  fetchList();
});
</script>

<template>
  <div style="position: relative">
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <FilterBar :showSearch="false" :showCount="true" :count="state.totalCount">
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
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="tableCols"
      :rows="state.list"
      :gridCols="gridCols"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의평가가 없습니다."
    >
      <article
        class="tbl-row pointer"
        v-for="item in state.list"
        :key="item.lectureId"
        @click="moveToDetail(item)"
      >
        <div class="txt-left txt-ellipsis">{{ item.lectureName }}</div>
        <div v-if="role === 'STUDENT'">{{ item.proName }}</div>
        <div>{{ formatPeriod(item) }}</div>
        <div>{{ getBadge(item).label }}</div>
      </article>
    </DataTable>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goToPage"
    />

    <div class="card notice-panel" style="margin-top: 16px;">
      <h3 class="notice-title">나의 강의평가</h3>
      <p class="notice-desc">목록에서 강의를 선택하면 상세 내용을 확인할 수 있습니다.</p>
      <div class="tbl-scroll">
        <table class="data-tbl">
          <colgroup>
            <col style="width: 110px"/>
            <col/>
          </colgroup>
          <tbody>
            <template v-if="role === 'STUDENT'">
              <tr><th><span class="text-badge text-pending">강의진행중</span></th><td>강의평가 기간이 시작되지 않은 강의입니다.</td></tr>
              <tr><th><span class="text-badge text-rejected">미작성</span></th><td>강의평가 기간이며 아직 평가를 작성하지 않은 강의입니다.</td></tr>
              <tr><th><span class="text-badge">완료</span></th><td>강의평가를 완료한 강의입니다.</td></tr>
              <tr><th><span class="text-badge text-closed">만료</span></th><td>평가 기간이 종료되어 더 이상 작성할 수 없습니다.</td></tr>
            </template>
            <template v-else>
              <tr><th><span class="text-badge text-pending">강의진행중</span></th><td>강의평가 기간이 시작되지 않은 강의입니다.</td></tr>
              <tr><th><span class="text-badge">진행중</span></th><td>현재 강의평가 기간입니다. 결과는 기간 종료 후 확인 가능합니다.</td></tr>
              <tr><th><span class="text-badge">평가완료</span></th><td>강의평가 기간이 종료되어 결과를 확인할 수 있습니다.</td></tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.badge.before  { color: $font-color-light; }
.badge.pending { color: #c62828; }
.badge.done    { color: $font-color-bold; }
.badge.expired { color: $font-color-light; }

:deep(.tbl-row div.txt-left) { justify-content: flex-start; }
:deep(.tbl-row div.txt-ellipsis) { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: block; padding: 10px; }
</style>
