<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import ScheduleService from '@/services/scheduleService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import MajorRequestDetail from '@/components/member/request/MajorRequestDetail.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();
const modal = useModalStore();

const {
  filter, searchQuery, searchInput, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, onSearch, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ selectedYear: '' });

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });
const isPeriod = ref(true);

const yearOf = (item) => item.createdAt?.slice(0, 4);
const yearOptions = computed(() => [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse());
const hasPending = computed(() => state.list.some(i => i.status === 'PENDING'));

const filteredList = computed(() =>
  state.list.filter(i => {
    if (filter.selectedYear && yearOf(i) !== filter.selectedYear) return false;
    if (searchInput.value && !i.targetMajorName?.includes(searchInput.value)) return false;
    return true;
  })
);
const { pagedList, maxPage } = paginate(filteredList);

const fetchPeriodStatus = async () => {
  try {
    const res = await ScheduleService.getActiveSchedules();
    const active = res.data?.data ?? {};
    isPeriod.value = !!active['전공변경신청'];
  } catch {
    isPeriod.value = false;
  }
};

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllMyMajorRequest();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};

const selectItem = async (id) => {
  if (selectedId.value === id) {
    selectedId.value = null;
    detail.data = null;
    return;
  }
  selectedId.value = id;
  detail.isLoading = true;
  detail.data = null;
  try {
    const res = await MemberService.findMyMajorRequest(id);
    detail.data = res.data ?? res;
  } catch (err) {
    console.error('상세 로드 실패:', err);
    selectedId.value = null;
  } finally {
    detail.isLoading = false;
  }
};

const cancelRequest = async () => {
  const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
  if (!confirmed) return;
  try {
    await MemberService.cancelMajorRequest(selectedId.value);
    modal.showAlert('신청이 취소되었습니다.', 'success');
    selectedId.value = null;
    detail.data = null;
    await fetchList();
  } catch (err) {
    console.error('신청 취소 실패:', err);
  }
};

const downloadFile = async () => {
  if (detail.data?.status === 'CANCELLED') {
    modal.showAlert('취소된 신청서의 첨부 파일은 다운로드할 수 없습니다.', 'warning');
    return;
  }
  try {
    await MemberService.downloadMyMajorRequestFile(selectedId.value);
  } catch (err) {
    console.error('파일 다운로드 실패:', err);
  }
};

const GRID_COLS = '120px 1fr 1fr 80px';
const TABLE_COLS = ['일자', '유형', '학과', '상태'];
onMounted(() => Promise.all([fetchPeriodStatus(), fetchList()]));
</script>

<template>
  <div>
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasFilter"
               placeholder="신청 학과 검색" @search="onSearch" @reset="resetFilter"
               :showCount="true" :count="filteredList.length"
               :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
               @pageSizeChange="onPageSizeChange">
      <div class="filter-item">
        <div class="input-label">신청 연도</div>
        <div class="input-content">
          <select v-model="filter.selectedYear" @change="onFilterChange">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>
      <button v-if="isPeriod && !hasPending" class="btn btn-submit"
              @click="router.push('/members/major-request/new')">
        <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
      </button>
    </FilterBar>
    <div class="split-layout">
      <div class="split-list">
        <DataTable
        :columns="TABLE_COLS"
        :rows="pagedList"
        :gridCols="GRID_COLS"
        :isLoading="state.isLoading"
        emptyMessage="신청 내역이 없습니다."
      >
        <article class="tbl-row pointer" v-for="item in pagedList" :key="item.requestId"
                 @click="selectItem(item.requestId)">
                 <div>{{ formatDateTime(item.createdAt) }}</div>
          <div>{{ MAJOR_REQUEST_TYPE[item.type] ?? item.type }}</div>
          <div>{{ item.targetMajorName }}</div>
          <div>{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
        </article>
      </DataTable>

      <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10"
                  @goToPage="goToPage" />
    </div>
    <div class="split-detail">
      <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="md" />

      <template v-if="!detail.isLoading && detail.data">
        <MajorRequestDetail :request="detail.data" @downloadFile="downloadFile" />
        <div class="page-footer">
          <div class="action-group" style="margin-left: auto">
            <button v-if="detail.data.status === 'PENDING'" class="btn btn-default" @click="cancelRequest">
              <font-awesome-icon icon="fa-solid fa-xmark" /> 신청 취소
            </button>
            <button v-if="detail.data.status === 'REJECTED' && isPeriod && !hasPending"
                    class="btn btn-submit" @click="router.push('/members/major-request/new')">
              <font-awesome-icon icon="fa-solid fa-paper-plane" /> 재신청
            </button>
          </div>
        </div>
      </template>
      <div v-else-if="!detail.isLoading" class="notice-panel card">
        <h3 class="notice-title">전공 변경 신청 안내</h3>
        <p class="notice-desc">
          전과 및 부전공 신청서를 작성할 수 있습니다.<br />
          목록에서 신청 내역을 클릭하면 상세 내용을 확인할 수 있습니다.
        </p>
        <table class="notice-table">
          <colgroup>
            <col style="width: 72px" />
            <col />
          </colgroup>
          <tbody>
            <tr>
              <th>전과</th>
              <td>현재 소속 학과에서 다른 학과로 전과 신청합니다. 관련 서류가 있는 경우 첨부해 주세요.</td>
            </tr>
            <tr>
              <th>부전공</th>
              <td>주전공 외에 부전공을 추가로 이수하는 신청입니다. 관련 서류가 있는 경우 첨부해 주세요.</td>
            </tr>
          </tbody>
        </table>
        <p class="notice-caution">대기 중인 신청서가 있는 경우 새로운 신청이 불가합니다.</p>
      </div>
    </div>
  </div>
</div>
</template>