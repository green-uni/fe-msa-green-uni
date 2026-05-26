<script setup>
import { ref, computed, onMounted } from 'vue'
import lectureService from '@/services/lectureService.js'
import { useAuthStore } from '@/stores/authentication'
 
const authStore = useAuthStore()
 
const DAYS = ['월', '화', '수', '목', '금']
 
const PERIODS = [
  { num: 1, time: '09:00' },
  { num: 2, time: '10:00' },
  { num: 3, time: '11:00' },
  { num: 4, time: '12:00' },
  { num: 5, time: '13:00' },
  { num: 6, time: '14:00' },
  { num: 7, time: '15:00' },
  { num: 8, time: '16:00' },
  { num: 9, time: '17:00' },
]
 
const todayLabel = computed(() => {
  const day = new Date().getDay()
  const map = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' }
  return map[day] ?? null
})
 
const lectures = ref([])
const loading = ref(false)
 
const getCell = (day, periodNum) => {
  for (const lec of lectures.value) {
    for (const s of lec.schedules) {
      if (
        s.dayOfWeek === day &&
        periodNum >= s.startPeriod &&
        periodNum <= s.endPeriod
      ) {
        if (periodNum === s.startPeriod) {
          return { ...lec, building: s.building, room: s.room }
        } else {
          return { hidden: true }
        }
      }
    }
  }
  return null
}
 
 
onMounted(async () => {
  loading.value = true
  try {
    const res = authStore.role === 'PROFESSOR'
      ? await lectureService.dashboardProfessorTimetable()
      : await lectureService.dashboardStudentTimetable()
    lectures.value = res.data ?? []
  } catch (e) {
    console.error('시간표 조회 실패', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="timetable-wrap">
    <div class="timetable-header">
      <span class="timetable-title">주간 시간표</span>
    </div>
 
    <div v-if="loading" class="timetable-empty">불러오는 중...</div>
    <div v-else-if="!lectures.length" class="timetable-empty">등록된 강의가 없습니다.</div>
 
    <div v-else class="timetable-grid-wrap">
      <table class="timetable">
        <thead>
          <tr>
            <th class="th-period">시간</th>
            <th
              v-for="day in DAYS"
              :key="day"
              :class="{ 'th-today': day === todayLabel }"
            >{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="period in PERIODS" :key="period.num">
            <td class="td-period">
              <span class="period-num">{{ period.num }}교시</span>
              <span class="period-time">{{ period.time }}</span>
            </td>
            <td
              v-for="day in DAYS"
              :key="day"
              class="td-cell"
              :class="{
                'td-today': day === todayLabel,
                'td-today-filled': day === todayLabel && getCell(day, period.num) && !getCell(day, period.num).hidden
              }"
            >
              <div v-if="getCell(day, period.num) && !getCell(day, period.num).hidden" class="cell-content">
                <span class="cell-name">{{ getCell(day, period.num).lectureName }}</span>
                <span class="cell-room">
                  {{ getCell(day, period.num).building }} {{ getCell(day, period.num).room }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<style scoped lang="scss">
.timetable-wrap {
  width: 35%;
}
 
.timetable-header {
  margin-bottom: 8px;
}
 
.timetable-title {
  font-size: 13px;
  font-weight: 600;
  color: $admin-font-color;
}
 
.timetable-empty {
  font-size: 12px;
  color: #999;
  padding: 20px 0;
  text-align: center;
}
 
.timetable-grid-wrap {
  overflow-x: auto;
}
 
.timetable {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  table-layout: fixed;
}
 
.timetable th,
.timetable td {
  border: 1px solid #e8e8e8;
  text-align: center;
  vertical-align: top;
  padding: 3px 2px;
}
 
.timetable thead th {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #555;
  padding: 5px 2px;
  font-size: 11px;
 
  &.th-today {
    background-color: $green-600;
    color: #fff;
  }
}
 
.th-period {
  width: 46px;
}
 
.td-period {
  background-color: #fafafa;
  vertical-align: middle;
  text-align: center;
}
 
.period-num {
  display: block;
  font-weight: 600;
  color: #444;
  font-size: 10px;
}
 
.period-time {
  display: block;
  color: #aaa;
  font-size: 9px;
  margin-top: 1px;
}
 
.td-cell {
  height: 44px;
  background-color: #fff;
 
  &.td-today {
    background-color: #f0faf5;
  }
 
  &.td-today-filled {
    background-color: #c2e8d4;
  }
}
 
.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 2px;
  padding: 3px 2px;
}
 
.cell-name {
  font-weight: 600;
  color: $green-600;
  font-size: 10px;
  word-break: keep-all;
  line-height: 1.3;
}
 
.cell-room {
  font-size: 9px;
  color: #888;
  word-break: keep-all;
}
</style>