<script setup>
import { ref, onMounted } from 'vue'
import ScheduleService from '@/services/scheduleService.js'
 
const SCHEDULE_MAP = {
  COURSE_REGISTRATION:  { label: '수강신청',     link: '/courses' },
  COURSE_MODIFICATION:  { label: '수강정정',     link: '/courses' },
  GRADE_INPUT:          { label: '성적입력',     link: '/grades' },
  GRADE_VIEW:           { label: '성적조회',     link: '/student/grades' },
  GRADE_APPEAL:         { label: '성적이의신청',  link: '/student/grades/appeals' },
  LECTURE_EVALUATION:   { label: '강의평가',     link: '/evaluations' },
  TUITION_PAYMENT:      { label: '등록금납부',    link: '/tuitions/my' },
  LECTURE_REGISTRATION: { label: '강의개설신청',  link: '/lectures' },
  MAJOR_CHANGE:         { label: '전공변경신청',  link: '/members/major-request' },
  SEMESTER_START:       { label: '학기시작',     link: null },
  ETC:                  { label: '기타',         link: null },
}
 
const activeSchedule = ref(null)
 
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
 
const calcDaysLeft = (endDateStr) => {
  if (!endDateStr) return 0
  const end = new Date(endDateStr)
  const today = new Date()
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)))
}
 
onMounted(async () => {
  try {
    const res = await ScheduleService.getActiveBannerSchedule()
    const active = res.data?.data
    if (!active) return
 
    const mapped = SCHEDULE_MAP[active.type]
    if (!mapped) return
 
    activeSchedule.value = {
      label: mapped.label,
      link: mapped.link,
      dateRange: `${formatDate(active.startDate)}~${formatDate(active.endDate)}`,
      daysLeft: calcDaysLeft(active.endDate),
    }
  } catch (e) {
    console.error('배너 조회 실패', e)
  }
})
</script>


<template>
  <div v-if="activeSchedule" class="banner-wrap">
    <div class="banner-info">
      <span class="banner-dot"></span>
      <div class="banner-text">
        <span class="banner-title">{{ activeSchedule.label }} 진행 중</span>
        <span class="banner-date">{{ activeSchedule.dateRange }} · 종료까지 {{ activeSchedule.daysLeft }}일 남음</span>
      </div>
    </div>
    <router-link v-if="activeSchedule.link" :to="activeSchedule.link" class="banner-btn">
      {{ activeSchedule.label }} 바로가기 →
    </router-link>
  </div>
  <div v-else class="banner-empty">
    현재 진행중인 일정이 없습니다.
  </div>
</template>


<style scoped lang="scss">
.banner-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f0faf5;
  border: 1px solid #c2e8d4;
  border-radius: 8px;
  padding: 12px 16px;
  gap: 12px;
}
 
.banner-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
 
.banner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: $green-600;
  flex-shrink: 0;
}
 
.banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
 
.banner-title {
  font-size: 13px;
  font-weight: 600;
  color: $green-600;
}
 
.banner-date {
  font-size: 11px;
  color: #888;
}
 
.banner-btn {
  font-size: 12px;
  font-weight: 600;
  color: $green-600;
  border: 1px solid $green-600;
  border-radius: 6px;
  padding: 6px 12px;
  white-space: nowrap;
  text-decoration: none;
 
  &:hover {
    background-color: $green-600;
    color: #fff;
  }
}
 
.banner-empty {
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 12px;
  background-color: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
</style>