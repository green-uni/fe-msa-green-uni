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
    COURSE_REGISTRATION:  'dot-blue',
    COURSE_MODIFICATION:  'dot-blue',
    GRADE_INPUT:          'dot-purple',
    GRADE_VIEW:           'dot-purple',
    GRADE_APPEAL:         'dot-purple',
    LECTURE_EVALUATION:   'dot-red',
    TUITION_PAYMENT:      'dot-orange',
    LECTURE_REGISTRATION: 'dot-green',
    MAJOR_CHANGE:         'dot-orange',
    SEMESTER_START:       'dot-green',
    ETC:                  'dot-gray',
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
    <div class="schedule-header">
      <span class="schedule-title">학사일정</span>
      <router-link :to="authStore.role === 'ADMIN' ? '/admin/schedules' : '/schedules'" class="schedule-more">전체보기</router-link>
    </div>
      <div v-if="loading" class="schedule-empty">불러오는 중...</div>
    <div v-else-if="!schedules.length" class="schedule-empty">이번 달 진행중인 일정이 없습니다.</div>
 
    <ul v-else class="schedule-list">
      <li v-for="s in schedules" :key="s.scheduleId" class="schedule-item">
        <span class="schedule-dot" :class="dotClass(s.type)"></span>
        <div class="schedule-info">
          <span class="schedule-name">{{ s.title }}</span>
          <span class="schedule-date">{{ formatDate(s.startDate) }} ~ {{ formatDate(s.endDate) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.schedule-wrap {
  width: 100%;
}
 
.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
 
.schedule-title {
  font-size: 13px;
  font-weight: 600;
  color: $admin-font-color;
}
 
.schedule-more {
  font-size: 11px;
  color: #999;
  text-decoration: none;
 
  &:hover {
    color: $green-600;
  }
}
 
.schedule-empty {
  font-size: 12px;
  color: #999;
  padding: 16px 0;
  text-align: center;
}
 
.schedule-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
 
.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
 
.schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
 
  &.dot-blue   { background-color: #4a90d9; }
  &.dot-purple { background-color: #9b59b6; }
  &.dot-red    { background-color: #e74c3c; }
  &.dot-orange { background-color: #e67e22; }
  &.dot-green  { background-color: $green-600; }
  &.dot-gray   { background-color: #aaa; }
}
 
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
 
.schedule-name {
  font-size: 12px;
  font-weight: 600;
  color: $admin-font-color;
}
 
.schedule-date {
  font-size: 11px;
  color: #aaa;
}
</style>