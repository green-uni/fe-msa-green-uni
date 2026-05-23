<script setup>
import { computed } from 'vue';
import { APPROVAL_STATUS, STATUS_REQUEST_TYPE } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const props = defineProps({
  request: { type: Object, required: true },
  onDownload: { type: Function, default: null },
  adminView: { type: Boolean, default: true },
});

const statusBadgeClass = computed(() => ({
  PENDING:   'badge-pending',
  APPROVED:  'badge-running',
  REJECTED:  'badge-rejected',
  CANCELLED: 'badge-closed',
}[props.request.status] ?? ''));

const isAbsence = computed(() => props.request.type === 'ABSENCE');
</script>

<template>
  <div class="detail-panel">

    <div v-if="$slots.actions" class="panel-actions">
      <slot name="actions" />
    </div>

    <div class="info-container g20">

      <!-- 좌측: 신청자 정보 (관리자만) -->
      <div v-if="adminView" class="content-wrap info-wrap info-card g20" style="--flex-width: 260px;">
        <div class="info-title">
          <h2>{{ request.studentName }}</h2>
          <span class="info-detail">{{ request.memberCode }}</span>
        </div>
        <div class="info-list">
          <dl class="info-row">
            <dt>학년/학기</dt>
            <dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd>
          </dl>
        </div>
      </div>

      <!-- 우측: 신청 내용 -->
      <div class="info-wrap content-wrap info-content d-flex direct-col g20">

        <div class="request-status-row">
          <span :class="['status-badge', statusBadgeClass]">
            {{ APPROVAL_STATUS[request.status] ?? request.status }}
          </span>
        </div>

        <div class="info-list">
          <dl class="info-row">
            <dt>신청일</dt>
            <dd>{{ formatDateTime(request.createdAt) }}</dd>
          </dl>
          <dl class="info-row" v-if="!adminView">
            <dt>학년/학기</dt>
            <dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd>
          </dl>
          <dl class="info-row">
            <dt>신청 유형</dt>
            <dd>{{ STATUS_REQUEST_TYPE[request.type] ?? request.type }}</dd>
          </dl>
          <dl class="info-row">
            <dt>시작일</dt>
            <dd>{{ request.startDate ?? '-' }}</dd>
          </dl>
          <template v-if="isAbsence">
            <dl class="info-row">
              <dt>복학 예정 연도</dt>
              <dd>{{ request.returnYear }}년</dd>
            </dl>
            <dl class="info-row">
              <dt>복학 예정 학기</dt>
              <dd>{{ request.returnSemester }}학기</dd>
            </dl>
          </template>
          <dl class="info-row">
            <dt>신청 사유</dt>
            <dd class="reason-text">{{ request.reason }}</dd>
          </dl>
          <dl class="info-row">
            <dt>첨부 파일</dt>
            <dd>
              <button v-if="request.originalFileName && onDownload"
                class="file-link" @click="onDownload">
                <font-awesome-icon icon="fa-solid fa-paperclip" />
                {{ request.originalFileName }}
              </button>
              <span v-else-if="request.originalFileName">
                <font-awesome-icon icon="fa-solid fa-paperclip" />
                {{ request.originalFileName }}
              </span>
              <span v-else class="empty-text">첨부 파일 없음</span>
            </dd>
          </dl>
          <dl class="info-row" v-if="request.updaterName">
            <dt>처리자</dt>
            <dd>{{ request.updaterName }}</dd>
          </dl>
          <dl class="info-row" v-if="request.status !== 'PENDING' && request.updatedAt">
            <dt>처리일</dt>
            <dd>{{ formatDateTime(request.updatedAt) }}</dd>
          </dl>
        </div>

        <div v-if="request.status === 'REJECTED' && request.rejectReason" class="result-box rejected">
          <p class="result-title">반려 사유</p>
          <p class="result-body">{{ request.rejectReason }}</p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px;}

.info-list { display: flex; flex-direction: column; }
.info-row  { display: flex; flex-direction: row; gap: 15px; padding: 10px 0; align-items: flex-start; }
.info-row:not(:first-child) { border-top: 1px solid var(--line-color); }
.info-row dt { min-width: 90px; text-align: right; color: var(--main-color); font-weight: bold; font-size: var(--text-sm); padding-top: 1px; }
.info-row dd { flex: 1; }

.request-status-row { display: flex; align-items: center; gap: 10px; }

.reason-text { white-space: pre-wrap; line-height: 1.6; }

.file-link { display: inline-flex; align-items: center; gap: 5px; color: var(--main-color); text-decoration: underline; text-underline-offset: 3px;  font-size: var(--text-sm);  background: none; border: none; cursor: pointer; padding: 0;}
.empty-text { color: #aaa; font-size: var(--text-sm); }

.result-box { padding: 14px 16px; border-radius: 8px; display: flex; flex-direction: column;  gap: 6px;}
.result-box.rejected { background: #fff8f8; border: 1px solid #ffcdd2; }
.result-title { font-weight: 700; font-size: var(--text-sm); color: #c62828; }
.result-body { font-size: var(--text-sm); color: #444; line-height: 1.6; }
</style>
