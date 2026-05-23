<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import { useModalStore } from '@/stores/modal';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusRequestDetail from '@/components/member/StatusRequestDetail.vue';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();

const requestId = route.params.requestId;
const request = ref(null);
const isLoading = ref(false);

const isPending = computed(() => request.value?.status === 'PENDING');

const showRejectBox = ref(false);
const rejectReason = ref('');

const openRejectBox = () => {
  showRejectBox.value = true;
  rejectReason.value = '';
};
const closeRejectBox = () => {
  showRejectBox.value = false;
  rejectReason.value = '';
};

const approve = async () => {
  const confirmed = await modal.showConfirm('이 신청서를 승인하시겠습니까?', 'success');
  if (!confirmed) return;
  try {
    await MemberService.processStatusRequest(requestId, { status: 'APPROVED' });
    await fetchRequest();
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
    closeRejectBox();
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
      <button class="btn btn-default" @click="goBack">
        <font-awesome-icon icon="fa-solid fa-list" /> 목록
      </button>
      <div v-if="isPending" class="action-group">
        <button class="btn btn-success" @click="approve">승인</button>
        <button v-if="!showRejectBox" class="btn btn-danger" @click="openRejectBox">반려</button>
      </div>
    </div>

    <div v-if="showRejectBox" class="rejection-box">
      <textarea
        v-model="rejectReason"
        class="rejection-textarea"
        placeholder="반려 사유를 입력해주세요."
        rows="3"
      />
      <div class="rejection-actions">
        <button class="btn btn-default" @click="closeRejectBox">취소</button>
        <button class="btn btn-danger" @click="reject">반려 처리</button>
      </div>
    </div>

    <StatusRequestDetail v-if="request" :request="request" :onDownload="downloadFile" />
  </div>
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;}
.action-group { display: flex; gap: 8px; }

.rejection-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding: 16px; background: #fff8f8; border: 1px solid #ffcdd2; border-radius: 8px;}
.rejection-textarea { width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; resize: vertical; font-size: var(--text-sm); font-family: inherit;  line-height: 1.5;}
.rejection-textarea:focus { outline: none; border-color: #c62828; }
.rejection-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
