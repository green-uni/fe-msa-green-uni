<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import ScheduleService from '@/services/scheduleService';
import CardListDetail from '@/components/common/CardListDetail.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useModalStore } from '@/stores/modal';
import { APPROVAL_STATUS } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();
const modal = useModalStore();

const state = reactive({ list: [], isLoading: false });
const selectedId = ref(null);
const detail = reactive({ data: null, isLoading: false });
const isInPeriod = ref(false);

const STATUS_CLASS = {
    PENDING:   'badge-pending',
    APPROVED:  'badge-approved',
    REJECTED:  'badge-rejected',
    CANCELLED: 'badge-cancelled',
};

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
        modal.showAlert('목록을 불러오는데 실패했습니다.', 'error');
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
        detail.data = res.data;
    } catch (err) {
        console.error('상세 로드 실패:', err);
        modal.showAlert('상세 정보를 불러오는데 실패했습니다.', 'error');
        selectedId.value = null;
    } finally {
        detail.isLoading = false;
    }
};

const cancelRequest = async () => {
    const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
    if (!confirmed) return;
    try {
        await MemberService.cancelMajorRequest(detail.data.requestId);
        selectedId.value = null;
        detail.data = null;
        await fetchList();
        modal.showAlert('신청이 취소되었습니다.', 'success');
    } catch (err) {
        console.error('신청 취소 실패:', err);
        modal.showAlert('신청 취소에 실패했습니다.', 'error');
    }
};

const downloadFile = async () => {
    if (detail.data.status === 'CANCELLED') {
        modal.showAlert('취소된 신청서의 첨부 파일은 다운로드할 수 없습니다.', 'warning');
        return;
    }
    try {
        await MemberService.downloadMajorRequestFile(detail.data.requestId);
    } catch {
        modal.showAlert('파일 다운로드에 실패했습니다.', 'error');
    }
};

const goToNew = () => router.push('/members/major-request/new');

onMounted(() => { fetchPeriodStatus(); fetchList(); });
</script>

<template>
    <div style="position: relative;">
        <LoadingSpinner v-if="state.isLoading" :overlay="true" size="md" />

        <div v-if="!isInPeriod" class="period-notice">
            현재 전공 변경 신청 기간이 아닙니다. 신청서 작성은 전공 변경 신청 기간에만 가능합니다.
        </div>

        <CardListDetail
            :items="state.list"
            :is-loading="state.isLoading"
            item-key="requestId"
            :selected-key="selectedId"
            empty-message="신청 내역이 없습니다."
            @select="selectItem"
        >
            <template #card="{ item }">
                <div class="card-left">
                    <span class="card-sub">{{ formatDateTime(item.createdAt) }}</span>
                    <span class="major-name"><small>[{{ item.type }}]</small>  {{ item.targetMajorName }}</span>
                </div>
                <span :class="['badge', STATUS_CLASS[item.status]]">
                    {{ APPROVAL_STATUS[item.status] ?? item.status }}
                </span>
            </template>

            <template #list-footer>
                <button class="btn btn-submit" @click="goToNew" :disabled="!isInPeriod">
                    <font-awesome-icon icon="fa-solid fa-plus" /> 신청서 작성
                </button>
            </template>

            <template #detail>
                <LoadingSpinner v-if="detail.isLoading" :overlay="true" size="sm" />
                <template v-if="detail.data && !detail.isLoading">
                    <div class="detail-status">
                        <span :class="['badge', STATUS_CLASS[detail.data.status]]">
                            {{ APPROVAL_STATUS[detail.data.status] ?? detail.data.status }}
                        </span>
                    </div>

                    <div class="detail-section">
                        <dl><dt>신청일</dt><dd>{{ formatDateTime(detail.data.createdAt) }}</dd></dl>
                        <dl><dt>유형</dt><dd>{{ detail.data.type }}</dd></dl>
                        <dl><dt>희망 학과</dt><dd>{{ detail.data.targetMajorName }}</dd></dl>
                    </div>

                    <div class="detail-section">
                        <dl class="full">
                            <dt>신청 사유</dt>
                            <dd class="reason-text">{{ detail.data.reason }}</dd>
                        </dl>
                    </div>

                    <div class="detail-section">
                        <dl>
                            <dt>첨부 파일</dt>
                            <dd>
                                <span v-if="detail.data.file" class="file-link" @click="downloadFile">
                                    {{ detail.data.originalFileName ?? '파일 다운로드' }}
                                </span>
                                <span v-else>-</span>
                            </dd>
                        </dl>
                    </div>

                    <!-- 반려: 반려 사유 + 재신청 -->
                    <template v-if="detail.data.status === 'REJECTED'">
                        <div class="reject-box">
                            <p class="reject-label">반려 사유</p>
                            <p class="reject-reason">{{ detail.data.rejectReason }}</p>
                        </div>
                        <div class="btn-row g10">
                            <button class="btn btn-submit" @click="goToNew">재신청</button>
                        </div>
                    </template>

                    <!-- 대기: 신청 취소 -->
                    <template v-else-if="detail.data.status === 'PENDING'">
                        <div class="btn-row g10">
                            <button class="btn btn-register-del" @click="cancelRequest">신청 취소</button>
                        </div>
                    </template>
                </template>
            </template>
        </CardListDetail>
    </div>
</template>

<style scoped lang="scss">
.period-notice {
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 6px;
    padding: 10px 16px;
    color: #795548;
    font-size: 0.9em;
    margin-bottom: 10px;
}

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
.badge-approved  { background: #e8f4f0; color: var(--main-color, #3e9e7e); }
.badge-rejected  { background: #fdecea; color: #d32f2f; }
.badge-cancelled { background: #f0f0f0; color: #888; }

/* 상세 패널 */
.detail-status {
    display: flex;
    justify-content: flex-end;
}

.detail-section {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;

    dl {
        display: flex;
        flex-direction: column;
        gap: 4px;

        &.full { width: 100%; }
    }

    dt {
        font-size: 13px;
        font-weight: 600;
        color: #555;
    }

    dd { font-size: 14px; }
}

.reason-text {
    line-height: 1.6;
    white-space: pre-wrap;
}

.file-link {
    color: var(--main-color);
    text-decoration: underline;
    cursor: pointer;
}

.reject-box {
    padding: 14px 16px;
    background: var(--error-bg);
    border: 1px solid #f5c6c6;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.reject-label {
    font-weight: bold;
    font-size: var(--text-sm);
    color: var(--error);
}

.reject-reason {
    font-size: 14px;
    color: #555;
    line-height: 1.6;
}
</style>
