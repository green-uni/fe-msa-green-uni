<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { STATUS_REQUEST_TYPE, STATUS_LABEL } from '@/utils/constants';
import { formatDateTime } from '@/utils/dateNumber';

const router = useRouter();

const props = defineProps({
  request: { type: Object, required: true },
  onDownload: { type: Function, default: null },
  adminView: { type: Boolean, default: true },
});

const isAbsence = computed(() => props.request.type === 'ABSENCE');
</script>

<template>
  <div class="detail-panel">

    <div v-if="$slots.actions" class="panel-actions">
      <slot name="actions" />
    </div>

    <div class="info-container g20">

      <!-- 좌측: 신청자 정보 (관리자만) -->
      <div v-if="adminView" class="content-wrap info-wrap info-card d-flex direct-col g20" style="--flex-width: 260px;">
        <div class="info-title">
          <h2>{{ request.studentName }}</h2>
          <span class="info-detail">{{ request.memberCode }}</span>
        </div>
        <div>
          <dl class="info-row">
            <dt>학과</dt>
            <dd>{{ request.currentMajorName ?? '-' }}<template v-if="request.currentMinorName"> / 부전공: {{ request.currentMinorName }}</template></dd>
          </dl>
          <dl class="info-row">
            <dt>학년/학기</dt>
            <dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd>
          </dl>
          <dl class="info-row">
            <dt>현재 학적</dt>
            <dd>{{ STATUS_LABEL.STUDENT[request.academicStatus] ?? request.academicStatus ?? '-' }}</dd>
          </dl>
          <dl class="info-row">
            <dt>취득 학점</dt>
            <dd>{{ request.totalCredits ?? '-' }}</dd>
          </dl>
          <dl class="info-row">
            <dt>연락처</dt>
            <dd>{{ request.phone ?? '-' }}</dd>
          </dl>
          <dl class="info-row">
            <dt>이메일</dt>
            <dd>{{ request.email ?? '-' }}</dd>
          </dl>
        </div>
        <button class="btn btn-default history-btn"
          @click="router.push(`/admin/members/${request.memberCode}`)">
          변동 이력 보기
        </button>
      </div>

      <!-- 우측: 신청 내용 -->
      <div class="info-wrap content-wrap info-content d-flex direct-col g20">

        <div class="d-flex direct-col g10">
          <dl>
            <dt>신청일</dt>
            <dd>{{ formatDateTime(request.createdAt) }}</dd>
          </dl>
          <dl v-if="!adminView">
            <dt>학년/학기</dt>
            <dd>{{ request.academicYear }}학년 {{ request.semester }}학기</dd>
          </dl>
          <dl>
            <dt>신청 유형</dt>
            <dd>{{ STATUS_REQUEST_TYPE[request.type] ?? request.type }} 신청</dd>
          </dl>
          <dl>
            <dt>시작일</dt>
            <dd>{{ request.startDate ?? '-' }}</dd>
          </dl>
          <template v-if="isAbsence">
            <dl>
              <dt>복학 예정 연도</dt>
              <dd>{{ request.returnYear }}년</dd>
            </dl>
            <dl>
              <dt>복학 예정 학기</dt>
              <dd>{{ request.returnSemester }}학기</dd>
            </dl>
          </template>
          <dl>
            <dt>신청 사유</dt>
            <dd class="reason-text">{{ request.reason }}</dd>
          </dl>
          <dl>
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
          <dl v-if="request.updaterName">
            <dt>처리자</dt>
            <dd>{{ request.updaterName }}</dd>
          </dl>
          <dl v-if="request.status !== 'PENDING' && request.updatedAt">
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
.reason-text { white-space: pre-wrap; line-height: 1.6; }
.history-btn { width: 100%; margin-top: 4px; font-size: 0.85em; }
</style>
