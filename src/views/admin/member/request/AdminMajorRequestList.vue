<script setup>
import { reactive, ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
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

const route = useRoute();
const router = useRouter();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange,
} = useListFilter({ status: '' })

const state = reactive({ list: [], isLoading: false })
const maxPage = ref(1)
const totalCount = ref(0)
const statusOptions = ref([]);

const STATUS_ORDER = Object.keys(APPROVAL_STATUS)
const statusTabs = computed(() => {
  const sorted = [...statusOptions.value].sort(
    (a, b) => STATUS_ORDER.indexOf(a.code) - STATUS_ORDER.indexOf(b.code)
  )
  return [{ code: '', value: '전체' }, ...sorted]
})

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllMajorRequests({
      status: filter.status || undefined,
      search: searchInput.value || undefined,
      page: currentPage.value,
      size: pageSize.value,
    })
    state.list = res.data.content ?? []
    maxPage.value = res.data.totalPages ?? 1
    totalCount.value = Number(res.data.totalElements ?? 0)
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

const GRID_COLS = 'minmax(85px, 0.8fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(90px, 0.9fr) minmax(75px, 0.7fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(80px, 0.8fr) minmax(70px, 0.6fr)';
const COLS_NAME = ['학번', '이름', '주전공', '부전공', '신청 유형', '신청 학과', '신청일자', '처리자', '상태'];
const moveToDetail = (id) => router.push(`/admin/members/major-request/${id}`)

const selectStatus = (code) => {
  filter.status = code
  onFilterChange()
}

watch(() => route.query, fetchList, { immediate: false })
watch(pageSize, fetchList, { immediate: false })

onBeforeRouteLeave((to) => {
  // 상세 페이지 이동은 필터 유지, 다른 섹션으로 이동 시 초기화
  if (!to.path.startsWith('/admin/members/major-request/')) {
    sessionStorage.removeItem(`listFilter:${route.path}`)
  }
})

onMounted(() => {
  fetchOptions()
  const hasUrlQuery = Object.keys(route.query).length > 0
  const stored = sessionStorage.getItem(`listFilter:${route.path}`)

  if (hasUrlQuery) {
    // URL에 query가 있는 경우:
    // useListFilter의 watcher는 { immediate: true } 옵션으로 setup() 단계에서 동기적으로 실행되므로
    // onMounted가 호출되는 시점에는 filter 값이 URL 기준으로 이미 세팅되어 있음.
    // 따라서 별도 복원 없이 바로 fetchList 호출.
    fetchList()
  } else if (stored) {
    // URL이 비어있지만 sessionStorage에 이전 필터가 저장된 경우:
    // useListFilter가 router.replace()로 URL을 복원하는 중이므로 여기서는 기다림.
    // URL 변경이 완료되면 아래의 watch(() => route.query) 가 반응해 fetchList를 호출.
  } else {
    // URL도 없고 sessionStorage도 없는 최초 진입:
    // PENDING을 기본 필터로 설정하고, onFilterChange()가 URL을 업데이트하면
    // watch(() => route.query) 가 반응해 fetchList를 호출.
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
              :showCount="true" :count="totalCount"
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
      :columns="COLS_NAME"
      :rows="state.list"
      :gridCols="GRID_COLS"
      :isLoading="state.isLoading"
      emptyMessage="조회된 신청서가 없습니다."
    >
      <article class="tbl-row pointer" v-for="item in state.list" :key="item.memberCode" @click="moveToDetail(item.requestId)">
        <div>{{ item.memberCode }}</div>
        <div>{{ item.studentName }}</div>
        <div>{{ item.currentMajorName }}</div>
        <div>{{ item.currentMinorName || '-' }}</div>
        <div>{{ MAJOR_REQUEST_TYPE[item.type] ?? item.type }}</div>
        <div>{{ item.targetMajorName }}</div>
        <div class="tbl-meta">{{ formatDateTime(item.createdAt) }}</div>
        <div>{{ item.updaterName ?? '-' }}</div>
        <div class="tbl-meta">{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                @goToPage="goToPage" />
  </div>
</template>
