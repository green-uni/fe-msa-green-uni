<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import ScheduleService from '@/services/scheduleService';
import CardListDetail from '@/components/common/CardListDetail.vue';
import MajorRequestDetail from '@/components/member/MajorRequestDetail.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();
const modal = useModalStore();

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });
const isInPeriod = ref(false);
const selectedYear = ref('');
const searchQuery = ref('');
const searchInput = ref('');

const STATUS_CLASS = {
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    CANCELLED: 'badge-cancelled',
};

// ── 연도 필터 ──────────────────────────────────────
const yearOf = (item) => item.createdAt?.slice(0, 4);

const yearOptions = computed(() =>
    [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse()
);

const hasSearchFilter = computed(() => !!searchInput.value || !!selectedYear.value);

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
        isInPeriod.value = !!(active.MAJOR_CHANGE || active['전공변경신청']);
    } catch {
        isInPeriod.value = false;
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

        <FilterBar v-model:searchQuery="searchQuery" :hasFilter="hasSearchFilter"
            placeholder="신청 학과 검색" @search="onSearch" @reset="resetFilter">
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

        <CardListDetail
            :items="filteredList"
            :is-loading="state.isLoading"
            item-key="requestId"
            :selected-key="selectedId"
            empty-message="신청 내역이 없습니다."
            @select="selectItem"
        >
            <template #card="{ item }">
                <div class="card-left">
                    <span class="card-sub">{{ formatDateTime(item.createdAt) }}</span>
                    <span class="major-name">
                        <small>[{{ MAJOR_REQUEST_TYPE[item.type] ?? item.type }}]</small>
                        {{ item.targetMajorName }}
                    </span>
                </div>
                <span :class="['badge', STATUS_CLASS[item.status]]">
                    {{ APPROVAL_STATUS[item.status] ?? item.status }}
                </span>
            </template>

            <template #list-footer>
                <button v-if="isInPeriod" class="btn btn-submit" @click="goToNew">
                    <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
                </button>
            </template>

            <template #detail>
                <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="sm" />
                <MajorRequestDetail
                    v-if="detail.data && !detail.isLoading"
                    :request="detail.data"
                    :onDownload="downloadFile"
                    :adminView="false"
                >
                    <template #actions>
                        <button
                            v-if="detail.data.status === 'PENDING'"
                            class="btn btn-register-del"
                            @click="cancelRequest"
                        >신청 취소</button>
                        <button
                            v-if="detail.data.status === 'REJECTED' && isInPeriod"
                            class="btn btn-submit"
                            @click="goToNew"
                        >재신청</button>
                    </template>
                </MajorRequestDetail>
            </template>
        </CardListDetail>
    </div>
</template>

<style scoped>
/* 카드 내부 */
.card-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.major-name {
    font-weight: 600;
    font-size: 15px;
}
.card-sub {
    font-size: 13px;
    color: #777;
}

/* 상태 배지 */
.badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}
.badge-pending   { background: #fff3e0; color: #ef6c00; }
.badge-approved  { background: #e8f4f0; color: var(--main-color); }
.badge-rejected  { background: #fdecea; color: #d32f2f; }
.badge-cancelled { background: #f0f0f0; color: #888; }
</style>
