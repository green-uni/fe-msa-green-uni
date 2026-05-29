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
      <dl class="req-row full"><dt>신청 사유</dt><dd class="reason-text">{{ request.reason }}</dd></dl>
      <dl class="req-row full"><dt>첨부 파일</dt><dd>
        <button v-if="request.originalFileName" class="file-link" @click="emit('downloadFile')">
          <font-awesome-icon icon="fa-solid fa-paperclip" /> {{ request.originalFileName }}
        </button>
        <span v-else class="empty-text">첨부 파일 없음</span>
      </dd></dl>
      <dl v-if="request.status !== 'PENDING' && request.updatedAt" class="req-row"><dt>처리일</dt><dd>{{ formatDateTime(request.updatedAt) }}</dd></dl>
      <dl v-if="request.updaterName" class="req-row"><dt>처리자</dt><dd>{{ request.updaterName }}</dd></dl>
    </div>
    <div v-if="request.status === 'REJECTED' && request.rejectReason" class="result-box rejected">
      <p class="result-title"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> 반려 사유</p>
      <p class="result-body">{{ request.rejectReason }}</p>
      <p class="result-at" v-if="request.updatedAt">{{ formatDateTime(request.updatedAt) }}</p>
    </div>
  </section>
</template>
