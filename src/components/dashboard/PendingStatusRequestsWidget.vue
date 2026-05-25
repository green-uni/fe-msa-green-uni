<script setup>
import { ref, onMounted } from 'vue'
import memberService from '@/services/memberService'
import { STATUS_REQUEST_TYPE } from '@/utils/constants.js'

const items = ref([])
const totalCount = ref(0)

const typeLabel = (type) => STATUS_REQUEST_TYPE[type] ?? type

onMounted(async () => {
  try {
    const res = await memberService.getDashboardStatusRequests()
    items.value = res.data ?? []
    totalCount.value = items.value.length
  } catch (e) {
    console.error('학적변경 신청 대기 목록 로드 실패', e)
  }
})
</script>

<template>
  <div class="widget-card">
    <div class="widget-header">
      <h3>학적 변경 신청 <span class="count">({{ totalCount }}건)</span></h3>
      <RouterLink to="/members/status-request" class="view-all">전체보기</RouterLink>
    </div>

    <div class="widget-body">
      <div
        v-for="(item, index) in items"
        :key="item.requestId"
        class="request-item"
      >
        <div class="item-top">
          <span class="student-name">{{ item.studentName }}</span>
          <span class="type-badge">{{ typeLabel(item.type) }}</span>
        </div>
        <p class="member-info">학번 {{ item.memberCode }} · {{ item.academicYear }}학년</p>
        <hr v-if="index < items.length - 1" class="divider" />
      </div>

      <div v-if="items.length === 0" class="empty-msg">
        승인 대기 중인 신청이 없습니다.
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
    font-size: 13px;
    font-weight: 600;
    color: $font-color;
    margin: 0;
  }

  .count { color: $font-color; }
}

.view-all {
  font-size: 13px;
  color: $font-color-light;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.widget-body { display: flex; flex-direction: column; }

.request-item { margin-bottom: 15px; }

.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.type-badge {
  font-size: 11px;
  font-weight: 600;
  color: $info;
  background-color: $info-bg;
  border-radius: 4px;
  padding: 2px 6px;
}

.member-info {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 15px 0;
}

.divider {
  border: 0;
  border-top: 1px solid #cbd5e1;
  margin: 0;
}

.empty-msg {
  text-align: center;
  color: #94a3b8;
  padding: 20px 0;
  font-size: 14px;
}
</style>
