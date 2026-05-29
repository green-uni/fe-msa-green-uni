<script setup>
import { reactive, computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusRequestDetail from '@/components/member/request/StatusRequestDetail.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS, STATUS_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';
import { useListFilter } from '@/composables/useListFilter';

const router = useRouter();
const modal = useModalStore();

const {
  filter, currentPage, pageSize, pageSizeOptions,
  hasFilter, onFilterChange, resetFilter, goToPage, onPageSizeChange, paginate,
} = useListFilter({ selectedYear: '' });

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });

const hasPending = computed(() => state.list.some(i => i.status === 'PENDING'));

const yearOf = (item) => item.createdAt?.slice(0, 4);
const yearOptions = computed(() => [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse());

const filteredList = computed(() =>
  state.list.filter(i => !filter.selectedYear || yearOf(i) === filter.selectedYear)
);
const { pagedList, maxPage } = paginate(filteredList);

const fetchList = async () => {
  state.isLoading = true;
  try {
    const res = await MemberService.findAllMyStatusRequests();
    state.list = res.data ?? [];
  } catch (err) {
    console.error('목록 로드 실패:', err);
  } finally {
    state.isLoading = false;
  }
};

const selectItem = async (id) => {
  selectedId.value = id;
  detail.isLoading = true;
  detail.data = null;
  try {
    const res = await MemberService.findMyStatusRequest(id);
    detail.data = res.data ?? res;
  } catch (err) {
    console.error('신청서 로드 실패:', err);
  } finally {
    detail.isLoading = false;
  }
};

const cancelRequest = async () => {
  const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
  if (!confirmed) return;
  try {
    await MemberService.cancelStatusRequest(selectedId.value);
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
    await MemberService.downloadMyStatusRequestFile(selectedId.value);
  } catch (err) {
    console.error('파일 다운로드 실패:', err);
  }
};

const GRID_COLS = '1fr 1fr 80px 80px 1fr';
const TABLE_COLUMN = ['일자', '유형', '학년', '학기', '상태']
onMounted(fetchList);
</script>

<template>
  <div>
    <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

    <FilterBar :hasFilter="hasFilter" :show-search="false" @reset="resetFilter" :showCount="true"
      :count="filteredList.length" :showPageSize="true" v-model:pageSize="pageSize" :pageSizeOptions="pageSizeOptions"
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
      <button v-if="!hasPending" class="btn btn-submit" @click="router.push('/members/status-request/new')">
        <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
      </button>
    </FilterBar>
    <div class="split-layout">
      <div class="split-list">
        <DataTable :columns="TABLE_COLUMN" :rows="pagedList" :gridCols="GRID_COLS" :isLoading="state.isLoading"
          emptyMessage="신청 내역이 없습니다.">
          <article class="tbl-row pointer" v-for="item in pagedList" :key="item.requestId" @click="selectItem(item.requestId)">
            <div>{{ formatDateTime(item.createdAt) }}</div>
            <div>{{ STATUS_REQUEST_TYPE[item.type] ?? item.type }}</div>
            <div>{{ item.academicYear }}학년</div>
            <div>{{ item.semester }}학기</div>
            <div>{{ APPROVAL_STATUS[item.status] ?? item.status }}</div>
          </article>
        </DataTable>

        <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10" @goToPage="goToPage" />
      </div>

      <div class="split-detail">
        <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="md" />

        <template v-if="!detail.isLoading && detail.data">
          <StatusRequestDetail :request="detail.data" @downloadFile="downloadFile" />
          <div class="page-footer">
            <div></div>
            <div class="action-group">
              <button v-if="detail.data.status === 'PENDING'" class="btn btn-default" @click="cancelRequest">
                <font-awesome-icon icon="fa-solid fa-xmark" /> 신청 취소
              </button>
              <button v-if="detail.data.status === 'REJECTED' && !hasPending" class="btn btn-submit"
                @click="router.push('/members/status-request/new')">
                <font-awesome-icon icon="fa-solid fa-paper-plane" /> 재신청
              </button>
            </div>
          </div>
        </template>
        <div v-else-if="!detail.isLoading" class="notice-panel card">
          <h3 class="notice-title">학적 변동 신청 안내</h3>
          <p class="notice-desc">
            휴학, 복학, 자퇴 신청서를 작성할 수 있습니다.<br />
            목록에서 신청 내역을 클릭하면 상세 내용을 확인할 수 있습니다.
          </p>
          <table class="notice-table">
            <colgroup>
              <col style="width: 72px" />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th>휴학</th>
                <td>복학 예정 연도·학기 입력이 필요합니다. 휴학 사유서를 첨부해 주세요.</td>
              </tr>
              <tr>
                <th>복학</th>
                <td>휴학 기간이 종료된 후 신청 가능합니다. 별도 서류는 필요하지 않습니다.</td>
              </tr>
              <tr>
                <th>자퇴</th>
                <td>자퇴 사유서를 첨부해 주세요.</td>
              </tr>
            </tbody>
          </table>
          <p class="notice-caution">대기 중인 신청서가 있는 경우 새로운 신청이 불가합니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>