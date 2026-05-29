<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MemberService from '@/services/memberService';
import { useModalStore } from '@/stores/modal';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import StatusRequestDetail from '@/components/member/request/StatusRequestDetail.vue';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();

const requestId = route.params.requestId;
const request = ref(null);
const isLoading = ref(false);

// 목록에서 router.push state로 전달됨; 직접 URL 접근 시 false
const hasPending = ref(history.state?.hasPending ?? false);

const cancelRequest = async () => {
  const confirmed = await modal.showConfirm('신청을 취소하시겠습니까?', 'warning');
  if (!confirmed) return;
  try {
    await MemberService.cancelStatusRequest(requestId);
    modal.showAlert('신청이 취소되었습니다.', 'success');
    router.push('/members/status-request');
  } catch (err) {
    console.error('신청 취소 실패:', err);
  }
};

const downloadFile = async () => {
  if (request.value?.status === 'CANCELLED') {
    modal.showAlert('취소된 신청서의 첨부 파일은 다운로드할 수 없습니다.', 'warning');
    return;
  }
  try {
    await MemberService.downloadMyStatusRequestFile(requestId);
  } catch (err) {
    console.error('파일 다운로드 실패:', err);
  }
};

const goBack = () => router.push('/members/status-request');
const goToNew = () => router.push('/members/status-request/new');

onMounted(async () => {
  isLoading.value = true;
  try {
    const res = await MemberService.findMyStatusRequest(requestId);
    request.value = res.data ?? res;
  } catch (err) {
    console.error('신청서 로드 실패:', err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="detail-wrap">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <template v-if="!isLoading && request">
      <StatusRequestDetail :request="request"  @downloadFile="downloadFile" />

      <div class="page-footer">
        <button class="btn btn-default" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <div class="action-group">
          <button v-if="request.status === 'PENDING'" class="btn btn-default" @click="cancelRequest">
            <font-awesome-icon icon="fa-solid fa-xmark" /> 신청 취소
          </button>
          <button v-if="request.status === 'REJECTED' && !hasPending" class="btn btn-submit" @click="goToNew">
            <font-awesome-icon icon="fa-solid fa-paper-plane" /> 재신청
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
