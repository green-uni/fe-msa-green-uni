<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import lectureService from '@/services/lectureService.js'
import { useAuthStore } from '@/stores/authentication'
import { BUILDING_LABEL } from '@/utils/constants'
 
const authStore = useAuthStore()
const router = useRouter()

const goToDetail = (cell) => {
  if (!cell || cell.hidden) return
  router.push({ path: `/lectures/${cell.lectureId}`, query: { from: 'DASHBOARD' } })
}
 
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
              <div
                v-if="getCell(day, period.num) && !getCell(day, period.num).hidden"
                class="cell-content"
                @click="goToDetail(getCell(day, period.num))"
              >
                <span class="cell-name">{{ getCell(day, period.num).lectureName }}</span>
                <span class="cell-room">
                  {{ BUILDING_LABEL[getCell(day, period.num).building] ?? getCell(day, period.num).building }} {{ getCell(day, period.num).room }}
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  overflow: hidden;
  background: #fff;
}

.timetable-header {
  flex-shrink: 0;
  margin-bottom: 8px;
}

.timetable-title {
  font-size: $fs-df;
  font-weight: 700;
  color: $font-color;
}

.timetable-empty {
  font-size: $fs-sm;
  color: $font-color-light;
  padding: 20px 0;
  text-align: center;
}

.timetable-grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.timetable {
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  font-size: $fs-xs;
  table-layout: fixed;
}

.timetable th,
.timetable td {
  border: 1px solid #e8e8e8;
  text-align: center;
  vertical-align: middle;
  padding: 4px 3px;
  &:nth-of-type(1){border-left: none;}
  &:nth-of-type(6){border-right: none;}
}
.timetable tr:nth-of-type(9) td{border-bottom:none;}

.timetable thead th {
  background-color: $default-bg;
  font-weight: 600;
  color: $font-color;
  font-size: $fs-xs;
  padding: 6px 3px;
  border-top: none;

  &.th-today {
    background-color: $green-600;
    color: #fff;
  }
}

.th-period {
  width: 58px;
}

.td-period {
  background-color: #fafafa;
  vertical-align: middle;
  text-align: center;
}

.period-num {
  display: block;
  font-weight: 700;
  color: $font-color-bold;
  font-size: $fs-sm;
}

.period-time {
  display: block;
  color: $font-color-light;
  font-size: $fs-xs;
  margin-top: 2px;
}

.td-cell {
  background-color: #fff;

  &.td-today        { background-color: #f0faf5; }
  &.td-today-filled { background-color: #c2e8d4; }
}

.cell-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 3px;
  padding: 4px 3px;
  cursor: pointer;
  &:hover .cell-name { text-decoration: underline; }
}

.cell-name {
  font-weight: 700;
  color: $green-600;
  font-size: $fs-sm;
  word-break: keep-all;
  line-height: 1.3;
}

.cell-room {
  font-size: $fs-xs;
  color: $font-color-light;
  word-break: keep-all;
}
</style>