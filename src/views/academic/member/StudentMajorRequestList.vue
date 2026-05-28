<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import ScheduleService from '@/services/scheduleService';
import CardListDetail from '@/components/common/CardListDetail.vue';
import MajorRequestDetail from '@/components/member/request/MajorRequestDetail.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE, TEXT_CLASS } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();
const modal = useModalStore();

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });
const isPeriod = ref(true);
const selectedYear = ref('');
const searchQuery = ref('');
const searchInput = ref('');

// ── 연도 필터 ──────────────────────────────────────
const yearOf = (item) => item.createdAt?.slice(0, 4);

const yearOptions = computed(() =>
    [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse()
);

const hasSearchFilter = computed(() => !!searchInput.value || !!selectedYear.value);

const hasPending = computed(() => state.list.some(i => i.status === 'PENDING'));

const filteredList = computed(() =>
    state.list.filter(i => {
        if (selectedYear.value && yearOf(i) !== selectedYear.value) return false;
        if (searchInput.value && !i.targetMajorName?.includes(searchInput.value)) return false;
        return true;
    })
);

const onSearch = () => { searchInput.value = searchQuery.value; };
const resetFilter = () => { searchQuery.value = ''; searchInput.value = ''; selectedYear.value = ''; };

// ── API ────────────────────────────────────────────
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

const selectItem = async (item) => {
    if (selectedId.value === item.requestId) {
        selectedId.value = null;
        detail.data = null;
        return;
    }
    selectedId.value = item.requestId;
    detail.data = null;
    detail.isLoading = true;
    try {
        const res = await MemberService.findMyMajorRequest(item.requestId);
        detail.data = res.data ?? res;
    } catch (err) {
        console.error('상세 로드 실패:', err);
        selectedId.value = null;
    } finally {
        detail.isLoading = false;
    }
};

// ── 액션 ───────────────────────────────────────────
const cancelRequest = async () => {
    const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
    if (!confirmed) return;
    try {
        await MemberService.cancelMajorRequest(detail.data.requestId);
        selectedId.value = null;
        detail.data = null;
        modal.showAlert('신청이 취소되었습니다.', 'success');
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
        await MemberService.downloadMyMajorRequestFile(detail.data.requestId);
    } catch (err) {
        console.error('파일 다운로드 실패:', err);
    }
};

const goToNew = () => router.push('/members/major-request/new');

onMounted(() => Promise.all([fetchPeriodStatus(), fetchList()]));
</script>

<template>
    <div style="position: relative;">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

        <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasSearchFilter" placeholder="신청 학과 검색"
            @search="onSearch" @reset="resetFilter">
            <div class="filter-item">
                <div class="input-label">신청 연도</div>
                <div class="input-content">
                    <select v-model="selectedYear">
                        <option value="">전체</option>
                        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
                    </select>
                </div>
            </div>
        </FilterBar>

        <CardListDetail :items="filteredList" :is-loading="state.isLoading" item-key="requestId"
            :selected-key="selectedId" empty-message="신청 내역이 없습니다." @select="selectItem">
            <template #card="{ item }">
                <div class="card-left">
                    <span class="card-sub">{{ formatDateTime(item.createdAt) }}</span>
                    <span class="request-title">
                        <small>[{{ MAJOR_REQUEST_TYPE[item.type] ?? item.type }}]</small>
                        {{ item.targetMajorName }}
                    </span>
                </div>
                <span :class="TEXT_CLASS[item.status]">
                    {{ APPROVAL_STATUS[item.status] ?? item.status }}
                </span>
            </template>

            <template #list-footer>
                <button v-if="isPeriod && !hasPending" class="btn btn-submit" @click="goToNew">
                    <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
                </button>
            </template>

            <template #detail>
                <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="sm" />
                <MajorRequestDetail v-if="detail.data && !detail.isLoading" :request="detail.data"
                    :onDownload="downloadFile" :adminView="false">
                    <template #actions>
                        <button v-if="detail.data.status === 'PENDING'" class="btn btn-register-del"
                            @click="cancelRequest">신청 취소</button>
                        <button v-if="detail.data.status === 'REJECTED' && isPeriod && !hasPending"
                            class="btn btn-submit" @click="goToNew">재신청</button>
                    </template>
                </MajorRequestDetail>
            </template>

            <template #detail-empty>
                <div class="notice-panel">
                    <h3 class="notice-title">전공 변경 신청 안내</h3>
                    <p class="notice-desc">
                        전과 및 부전공 신청서를 작성할 수 있습니다.<br />
                        좌측 목록에서 기존 신청 내역을 선택하면 상세 내용을 확인할 수 있습니다.
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
                    <p class="notice-caution">
                        대기 중인 신청서가 있는 경우 새로운 신청이 불가합니다.
                    </p>
                </div>
            </template>
        </CardListDetail>
    </div>
</template>
