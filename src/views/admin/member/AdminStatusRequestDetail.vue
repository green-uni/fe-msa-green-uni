<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import { useModalStore } from '@/stores/modal';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusRequestDetail from '@/components/member/StatusRequestDetail.vue';
import { BADGE_CLASS, APPROVAL_STATUS } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();

const requestId = route.params.requestId;
const request = ref(null);
const isLoading = ref(false);

const isPending = computed(() => request.value?.status === 'PENDING');

// 'approve' | 'reject' | null
const actionMode = ref(null);
const note = ref('');
const rejectReason = ref('');

const openAction = (mode) => {
  actionMode.value = mode;
  note.value = '';
  rejectReason.value = '';
};
const closeAction = () => {
  actionMode.value = null;
  note.value = '';
  rejectReason.value = '';
};

const approve = async () => {
  const confirmed = await modal.showConfirm('이 신청서를 승인하시겠습니까?', 'success');
  if (!confirmed) return;
  try {
    await MemberService.processStatusRequest(requestId, {
      status: 'APPROVED',
      note: note.value.trim() || undefined,
    });
    await fetchRequest();
    closeAction();
    modal.showAlert('승인되었습니다.', 'success');
  } catch (err) {
    console.error('승인 실패:', err);
  }
};

const reject = async () => {
  if (!rejectReason.value.trim()) {
    modal.showAlert('반려 사유를 입력해주세요.', 'warning');
    return;
  }
  const confirmed = await modal.showConfirm('이 신청서를 반려하시겠습니까?', 'warning');
  if (!confirmed) return;
  try {
    await MemberService.processStatusRequest(requestId, {
      status: 'REJECTED',
      rejectReason: rejectReason.value,
    });
    await fetchRequest();
    closeAction();
    modal.showAlert('반려 처리되었습니다.', 'success');
  } catch (err) {
    console.error('반려 실패:', err);
  }
};

const downloadFile = async () => {
  try {
    await MemberService.downloadStatusRequestFile(requestId);
  } catch (err) {
    console.error('파일 다운로드 실패:', err);
  }
};

const goBack = () => {
  const { requestId: _, ...query } = route.query;
  router.push({ path: '/admin/members/status-request', query });
};

const fetchRequest = async () => {
  isLoading.value = true;
  try {
    const res = await MemberService.findStatusRequest(requestId);
    request.value = res.data ?? res;
    console.log(res.data)
  } catch (err) {
    console.error('신청서 로드 실패:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchRequest);
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />
    <div class="page-header">
      <div class="d-flex ai-center g10">
        <button class="btn btn-default" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <span v-if="request" :class="BADGE_CLASS[request.status]">
          {{ APPROVAL_STATUS[request.status] ?? request.status }}
        </span>
      </div>
      <div v-if="isPending && !actionMode" class="action-group">
        <button class="btn btn-success" @click="openAction('approve')">승인</button>
        <button class="btn btn-danger" @click="openAction('reject')">반려</button>
      </div>
    </div>

    <div v-if="actionMode" class="action-box" :class="actionMode">
      <textarea
        v-if="actionMode === 'approve'"
        v-model="note"
        class="action-textarea"
        placeholder="승인 사유를 입력해주세요. (선택)"
        rows="3"
      />
      <textarea
        v-else
        v-model="rejectReason"
        class="action-textarea"
        placeholder="반려 사유를 입력해주세요."
        rows="3"
      />
      <div class="action-buttons">
        <button class="btn btn-default" @click="closeAction">취소</button>
        <button v-if="actionMode === 'approve'" class="btn btn-success" @click="approve">승인 처리</button>
        <button v-else class="btn btn-danger" @click="reject">반려 처리</button>
      </div>
    </div>

    <StatusRequestDetail v-if="request" :request="request" :onDownload="downloadFile" />
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.action-group { display: flex; gap: 8px; }

.action-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding: 16px; border-radius: 8px; border: 1px solid var(--line-color); }
.action-box.approve { background: #f8fcfa; border-color: var(--main-color); }
.action-box.reject  { background: #fff8f8; border-color: #ffcdd2; }

.action-textarea { width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; resize: vertical; font-size: var(--text-sm); font-family: inherit; line-height: 1.5; }
.action-box.approve .action-textarea:focus { outline: none; border-color: var(--main-color); }
.action-box.reject  .action-textarea:focus { outline: none; border-color: #c62828; }

.action-buttons { display: flex; gap: 8px; justify-content: flex-end; }

.btn-success { background: var(--main-color); color: #fff; border-color: var(--main-color); }
.btn-success:hover { filter: brightness(1.1); }
.btn-danger { background: #c62828; color: #fff; border-color: #c62828; }
.btn-danger:hover { filter: brightness(1.1); }
</style>
