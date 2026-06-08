<script setup>
import { computed } from 'vue';
import { BADGE_CLASS, APPROVAL_STATUS, STATUS_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const props = defineProps({
  request: { type: Object, required: true }
});

const emit = defineEmits(['downloadFile']);

const isAbsence = computed(() => props.request.type === 'ABSENCE');
</script>

<template>
  <section class="card">
    <div class="card-label">
      <span>{{ STATUS_REQUEST_TYPE[request.type] ?? request.type }} 신청</span>
      <span :class="BADGE_CLASS[request.status]">{{ APPROVAL_STATUS[request.status] ?? request.status }}</span>
    </div>

    <div class="req-list">
      <dl class="req-row"><dt>신청일</dt><dd>{{ formatDateTime(request.createdAt) }}</dd></dl>
      <dl class="req-row"><dt>학년/학기</dt><dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd></dl>
      <dl class="req-row"><dt>신청 유형</dt><dd>{{ STATUS_REQUEST_TYPE[request.type] ?? request.type }}</dd></dl>
      <dl class="req-row"><dt>시작일</dt><dd>{{ request.startDate ?? '-' }}</dd></dl>
      <template v-if="isAbsence">
        <dl class="req-row"><dt>복학 예정 연도</dt><dd>{{ request.returnYear }}년</dd></dl>
        <dl class="req-row"><dt>복학 예정 학기</dt><dd>{{ request.returnSemester }}학기</dd></dl>
      </template>
    </div>

    <p class="reason-text reason-body">{{ request.reason }}</p>

    <div v-if="request.originalFileName" class="attach-box">
      <button class="file-link" @click="emit('downloadFile')">
        <font-awesome-icon icon="fa-solid fa-paperclip" />
        {{ request.originalFileName }}
      </button>
    </div>
  </section>

  <section v-if="['APPROVED', 'REJECTED'].includes(request.status)" class="card">
    <div class="card-label">{{ request.status === 'APPROVED' ? '승인 정보' : '반려 정보' }}</div>
    <div class="info-grid" style="grid-template-columns: 1fr">
      <div class="info-item" v-if="request.status === 'REJECTED'">
        <span class="info-key">반려사유</span>
        <span class="info-val">{{ request.rejectReason || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="info-key">처리일</span>
        <span class="info-val">{{ formatDateTime(request.updatedAt) || '-' }}</span>
      </div>
      <div class="info-item">
        <span class="info-key">처리자</span>
        <span class="info-val">{{ request.updaterName ? `${request.updaterName} (${request.updaterCode})` : '-' }}</span>
      </div>
    </div>
  </section>
</template>
