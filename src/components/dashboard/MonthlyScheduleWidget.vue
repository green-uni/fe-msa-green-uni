<script setup>
import { ref, onMounted } from 'vue'
import ScheduleService from '@/services/scheduleService.js'
import { useAuthStore } from '@/stores/authentication'
const authStore = useAuthStore()

const schedules = ref([])
const loading = ref(false)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 와이어프레임 기준 색상 분기
const dotClass = (type) => {
  const map = {
    COURSE_REGISTRATION: 'dot-blue',
    COURSE_MODIFICATION: 'dot-blue',
    GRADE_INPUT: 'dot-purple',
    GRADE_VIEW: 'dot-purple',
    GRADE_APPEAL: 'dot-purple',
    LECTURE_EVALUATION: 'dot-red',
    TUITION_PAYMENT: 'dot-orange',
    LECTURE_REGISTRATION: 'dot-green',
    MAJOR_CHANGE: 'dot-orange',
    SEMESTER_START: 'dot-green',
    ETC: 'dot-gray',
  }
  return map[type] ?? 'dot-gray'
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await ScheduleService.getMonthlySchedules()
    const all = res.data?.data ?? []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 오늘 날짜 포함 or 오늘 이후인 일정만 필터 후 3개
    schedules.value = all
      .filter(s => new Date(s.endDate) >= today)
      .slice(0, 3)
  } catch (e) {
    console.error('학사일정 조회 실패', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="schedule-wrap">
    <div class="widget-header">
      <h3>학사일정</h3>
      <router-link :to="authStore.role === 'ADMIN' ? '/admin/schedules' : '/schedules'"
        class="view-all">전체보기</router-link>
    </div>
    <div v-if="loading" class="empty-msg">불러오는 중...</div>
    <div v-else-if="!schedules.length" class="empty-msg">이번 달 진행중인 일정이 없습니다.</div>

    <ul v-else class="dash-list">
      <li v-for="s in schedules" :key="s.scheduleId" class="dash-item schedule-item">
        <span class="dash-dot" :class="dotClass(s.type)"></span>
        <span class="dash-title schedule-name">{{ s.title }}</span>
        <time class="dash-date">{{ formatDate(s.startDate) }} ~ {{ formatDate(s.endDate) }}</time>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
// 색깔 분기 — 필요 시 주석 해제하면 유형별 색상 활성화됨
// .dash-dot {
//   &.dot-blue   { background-color: #4a90d9; }
//   &.dot-purple { background-color: #9b59b6; }
//   &.dot-red    { background-color: #e74c3c; }
//   &.dot-orange { background-color: #e67e22; }
//   &.dot-green  { background-color: $green-600; }
//   &.dot-gray   { background-color: #aaa; }
// }
</style>