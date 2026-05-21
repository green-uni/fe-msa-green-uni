<script setup>
import { computed } from 'vue';
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE } from '@/utils/constants';
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
</script>

<template>
  <div class="detail-panel">

    <!-- 액션 슬롯 (관리자 승인/반려, 학생 취소 등) -->
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
            <dt>현재 학과</dt>
            <dd>{{ request.currentMajorName }}</dd>
          </dl>
          <dl class="info-row" v-if="request.currentMinorName">
            <dt>현재 부전공</dt>
            <dd>{{ request.currentMinorName }}</dd>
          </dl>
          <dl class="info-row" v-if="request.gpa != null">
            <dt>학점</dt>
            <dd>{{ request.gpa }}</dd>
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
          <dl class="info-row">
            <dt>신청 유형</dt>
            <dd>{{ MAJOR_REQUEST_TYPE[request.type] ?? request.type }}</dd>
          </dl>
          <dl class="info-row">
            <dt>신청 학과</dt>
            <dd>{{ request.targetMajorName }}</dd>
          </dl>
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

        <!-- 반려사유 -->
        <div v-if="request.status === 'REJECTED' && request.rejectReason" class="result-box rejected">
          <p class="result-title">반려 사유</p>
          <p class="result-body">{{ request.rejectReason }}</p>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 액션 영역 ── */
.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
}

/* ── 좌측 info-card 행 ── */
.info-list { display: flex; flex-direction: column; }
.info-row  { display: flex; flex-direction: row; gap: 15px; padding: 10px 0; align-items: flex-start; }
.info-row:not(:first-child) { border-top: 1px solid var(--line-color); }
.info-row dt { min-width: 70px; text-align: right; color: var(--main-color); font-weight: bold; font-size: var(--text-sm); padding-top: 1px; }
.info-row dd { flex: 1; }

/* ── 우측 신청 내용 ── */
.request-status-row { display: flex; align-items: center; gap: 10px; }

.reason-text { white-space: pre-wrap; line-height: 1.6; }

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--main-color);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-size: var(--text-sm);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.empty-text { color: #aaa; font-size: var(--text-sm); }

/* ── 결과 박스 (반려/승인) ── */
.result-box {
  padding: 14px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.result-box.rejected { background: #fff8f8; border: 1px solid #ffcdd2; }

.result-title {
  font-weight: 700;
  font-size: var(--text-sm);
  color: #c62828;
}

.result-body { font-size: var(--text-sm); color: #444; line-height: 1.6; }
</style>
