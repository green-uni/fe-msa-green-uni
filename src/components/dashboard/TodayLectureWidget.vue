<script setup>
import { ref, onMounted } from 'vue'
import lectureService from '@/services/lectureService.js'
import { useAuthStore } from '@/stores/authentication'
import { useRouter } from 'vue-router'
const router = useRouter()
 
const lectures = ref([])
const loading = ref(false)
const authStore = useAuthStore()
 
const PERIOD_TIME = {
  1: '09:00', 2: '10:00', 3: '11:00', 4: '12:00',
  5: '13:00', 6: '14:00', 7: '15:00', 8: '16:00', 9: '17:00'
}
 
const periodToTime = (period) => PERIOD_TIME[period] ?? ''
 
const onQrClick = (lec) => {
  router.push(`/attendances/${lec.lectureId}/qr`)
}

const onLectureClick = (lec) => {
  router.push({ path: `/lectures/${lec.lectureId}`, query: { from: 'DASHBOARD' } })
}
 
onMounted(async () => {
  if (authStore.role !== 'PROFESSOR') return
  loading.value = true
  try {
    const res = await lectureService.dashboardTodayLectures()
    lectures.value = res.data ?? []
  } catch (e) {
    console.error('오늘 강의 조회 실패', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="today-wrap">
    <div class="widget-header">
      <h3>오늘 강의 목록</h3>
      <router-link to="/professor/lectures/my" class="view-all">전체보기</router-link>
    </div>

    <div v-if="loading" class="empty-msg">불러오는 중...</div>
    <div v-else-if="!lectures.length" class="empty-msg">오늘 강의가 없습니다.</div>

    <ul v-else class="dash-list">
      <li v-for="lec in lectures" :key="lec.lectureId" class="dash-item today-item">
        <div class="today-time">
          <span>{{ periodToTime(lec.startPeriod) }}</span>
          <span>{{ periodToTime(lec.endPeriod) }}</span>
        </div>
        <div class="today-info pointer" @click="onLectureClick(lec)">
          <span class="today-title">{{ lec.lectureName }}</span>
          <span class="today-room">{{ lec.building }} {{ lec.room }}</span>
        </div>
        <button
          class="qr-btn"
          :class="lec.isActive ? 'qr-btn--end' : 'qr-btn--start'"
          @click="onQrClick(lec)"
        >
          {{ lec.isActive ? 'QR종료' : 'QR시작' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.today-item { gap: 12px; }

.today-time { display: flex; flex-direction: column; align-items: center; font-size: $fs-xs;  color: $font-color-light; min-width: 40px; gap: 2px;}
.today-info { flex: 1; display: flex; flex-direction: column; gap: 2px; &.pointer { cursor: pointer; &:hover .today-title { color: $green-600; } } }
.today-title { font-weight: 600; color: $font-color;}
.today-room { font-size: $fs-xs; color: $font-color-light;} 
.qr-btn { 
  font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 4px; border: none; cursor: pointer; white-space: nowrap; 
  &--start { 
    background-color: #fff;  color: $green-600; border: 1px solid $green-600;
    &:hover { background-color: $green-600; color: #fff; }
  }
  &--end { 
    background-color: $font-color; color: #fff; 
    &:hover { opacity: 0.85; }
  }
}
</style>