<script setup>
import { BADGE_CLASS, APPROVAL_STATUS, MAJOR_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const props = defineProps({
  request: { type: Object, required: true },
});
const emit = defineEmits(['downloadFile']);
</script>

<template>
  <section class="card">
    <div class="card-label">
      <span>{{ MAJOR_REQUEST_TYPE[request.type] ?? request.type }} 신청</span>
      <span :class="BADGE_CLASS[request.status]">{{ APPROVAL_STATUS[request.status] ?? request.status }}</span>
    </div>

    <div class="req-list">
      <dl class="req-row"><dt>신청일</dt><dd>{{ formatDateTime(request.createdAt) }}</dd></dl>
      <dl class="req-row"><dt>학년/학기</dt><dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd></dl>
      <dl class="req-row"><dt>신청 유형</dt><dd>{{ MAJOR_REQUEST_TYPE[request.type] ?? request.type }}</dd></dl>
      <dl class="req-row"><dt>신청 학과</dt><dd>{{ request.targetMajorName }}</dd></dl>
      <dl v-if="request.status !== 'PENDING' && request.updatedAt" class="req-row"><dt>처리일</dt><dd>{{ formatDateTime(request.updatedAt) }}</dd></dl>
      <dl v-if="request.updaterName" class="req-row"><dt>처리자</dt><dd>{{ request.updaterName }}</dd></dl>
    </div>

    <p class="reason-text reason-body">{{ request.reason }}</p>

    <div v-if="request.originalFileName" class="attach-box">
      <button class="file-link" @click="emit('downloadFile')">
        <font-awesome-icon icon="fa-solid fa-paperclip" />
        {{ request.originalFileName }}
      </button>
    </div>

    <div v-if="request.status === 'REJECTED' && request.rejectReason" class="result-box rejected">
      <p class="result-title">반려 사유</p>
      <p class="result-body">{{ request.rejectReason }}</p>
    </div>
  </section>
</template>
