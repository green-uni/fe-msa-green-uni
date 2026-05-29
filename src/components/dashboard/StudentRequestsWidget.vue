<script setup>
import { ref, onMounted } from 'vue'
import memberService from '@/services/memberService'
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE, STATUS_REQUEST_TYPE } from '@/utils/constants.js'

const CATEGORY_LABEL = { STATUS: '학적변경 신청', MAJOR: '전공변경 신청' }
const TYPE_LABEL_MAP = { STATUS: STATUS_REQUEST_TYPE, MAJOR: MAJOR_REQUEST_TYPE }

const items = ref([])

const formatDate = (dateStr) => dateStr?.slice(0, 10).replaceAll('-', '.')

onMounted(async () => {
  try {
    const res = await memberService.getDashboardStudentRequests()
    items.value = res.data ?? []
  } catch (e) {
    console.error('신청 목록 로드 실패', e)
  }
})
</script>

<template>
  <div class="widget-card">
    <div class="widget-header">
      <h3>내 신청 처리 목록</h3>
    </div>
    <div class="widget-body">
      <div v-for="(item, index) in items" :key="item.requestId" class="request-item">
        <div class="item-row">
          <div class="item-info">
            <span class="category">{{ CATEGORY_LABEL[item.requestCategory] ?? item.requestCategory }}</span>
            <span class="type-name">{{ TYPE_LABEL_MAP[item.requestCategory]?.[item.type] ?? item.type }}</span>
          </div>
          <span class="status-badge" :class="`status-${item.status?.toLowerCase()}`">
            {{ APPROVAL_STATUS[item.status] ?? item.status }}
          </span>
        </div>
        <p class="item-date">{{ formatDate(item.createdAt) }}</p>
        <hr v-if="index < items.length - 1" class="divider" />
      </div>
      <div v-if="items.length === 0" class="empty-msg">
        신청 내역이 없습니다.
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 0.929em;
    font-weight: 600;
    color: $font-color;
    margin: 0;
  }
}

.widget-body { display: flex; flex-direction: column; }

.request-item { margin-bottom: 12px; }

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category {
  font-size: 0.786em;
  color: $font-color-light;
}

.type-name {
  font-size: 1em;
  font-weight: 600;
  color: $font-color;
}

.status-badge {
  font-size: 0.786em;
  font-weight: 600;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;

  &.status-pending  { color: $warning;  background-color: $warning-bg; }
  &.status-approved { color: $success;  background-color: $success-bg; }
  &.status-rejected { color: $error;    background-color: $error-bg; }
}

.item-date {
  font-size: 0.857em;
  color: $font-color-light;
  margin: 0 0 12px;
}

.divider {
  border: 0;
  border-top: 1px solid #cbd5e1;
  margin: 0;
}

.empty-msg {
  text-align: center;
  color: $font-color-light;
  padding: 20px 0;
  font-size: 1em;
}
</style>
