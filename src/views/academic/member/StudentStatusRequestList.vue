<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import CardListDetail from '@/components/common/CardListDetail.vue';
import StatusRequestDetail from '@/components/member/StatusRequestDetail.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS, STATUS_REQUEST_TYPE, TEXT_CLASS } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();
const modal = useModalStore();

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });
const selectedYear = ref('');


const yearOf = (item) => item.createdAt?.slice(0, 4);

const yearOptions = computed(() =>
    [...new Set(state.list.map(yearOf).filter(Boolean))].sort().reverse()
);

const hasSearchFilter = computed(() => !!selectedYear.value);
const hasPending = computed(() => state.list.some(i => i.status === 'PENDING'));

const filteredList = computed(() =>
    state.list.filter(i => {
        if (selectedYear.value && yearOf(i) !== selectedYear.value) return false;
        return true;
    })
);

const resetFilter = () => { selectedYear.value = ''; };

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
        const res = await MemberService.findMyStatusRequest(item.requestId);
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
        await MemberService.cancelStatusRequest(detail.data.requestId);
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
        await MemberService.downloadMyStatusRequestFile(detail.data.requestId);
    } catch (err) {
        console.error('파일 다운로드 실패:', err);
    }
};

const goToNew = () => router.push('/members/status-request/new');

onMounted(fetchList);
</script>

<template>
    <div style="position: relative;">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

        <FilterBar :hasFilter="hasSearchFilter" :show-search="false" @reset="resetFilter">
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
                    <span class="request-title">
                        <small>[{{ STATUS_REQUEST_TYPE[item.type] ?? item.type }}]</small>
                        {{ item.academicYear }}학년 {{ item.semester }}학기
                    </span>
                </div>
                <span :class="TEXT_CLASS[item.status]">
                    {{ APPROVAL_STATUS[item.status] ?? item.status }}
                </span>
            </template>

            <template #list-footer>
                <button v-if="!hasPending" class="btn btn-submit" @click="goToNew">
                    <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
                </button>
            </template>

            <template #detail>
                <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="sm" />
                <StatusRequestDetail
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
                            v-if="detail.data.status === 'REJECTED' && !hasPending"
                            class="btn btn-submit"
                            @click="goToNew"
                        >재신청</button>
                    </template>
                </StatusRequestDetail>
            </template>

            <template #detail-empty>
                <div class="notice-panel">
                    <h3 class="notice-title">학적 변동 신청 안내</h3>
                    <p class="notice-desc">
                        휴학, 복학, 자퇴 신청서를 작성할 수 있습니다.<br />
                        좌측 목록에서 기존 신청 내역을 선택하면 상세 내용을 확인할 수 있습니다.
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
                    <p class="notice-caution">
                        대기 중인 신청서가 있는 경우 새로운 신청이 불가합니다.
                    </p>
                </div>
            </template>
        </CardListDetail>
    </div>
</template>

