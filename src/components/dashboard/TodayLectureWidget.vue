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
    <div class="today-header">
      <span class="today-title">오늘 강의 목록</span>
      <router-link to="/professor/lectures/my" class="today-more">전체보기</router-link>
    </div>
 
    <div v-if="loading" class="today-empty">불러오는 중...</div>
    <div v-else-if="!lectures.length" class="today-empty">오늘 강의가 없습니다.</div>
 
    <ul v-else class="today-list">
      <li v-for="lec in lectures" :key="lec.lectureId" class="today-item">
        <div class="today-time">
          <span>{{ periodToTime(lec.startPeriod) }}</span>
          <span>{{ periodToTime(lec.endPeriod) }}</span>
        </div>
        <div class="today-info">
          <span class="today-name">{{ lec.lectureName }}</span>
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
.today-wrap {
  width: 100%;
}
 
.today-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
 
.today-title {
  font-size: 13px;
  font-weight: 600;
  color: $admin-font-color;
}
 
.today-more {
  font-size: 11px;
  color: #999;
  text-decoration: none;
 
  &:hover {
    color: $green-600;
  }
}
 
.today-empty {
  font-size: 12px;
  color: #999;
  padding: 20px 0;
  text-align: center;
}
 
.today-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
 
.today-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background-color: #fff;
}
 
.today-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  color: #888;
  min-width: 40px;
  gap: 2px;
}
 
.today-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
 
.today-name {
  font-size: 13px;
  font-weight: 600;
  color: $admin-font-color;
}
 
.today-room {
  font-size: 11px;
  color: #aaa;
}
 
.qr-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
 
  &--start {
    background-color: #fff;
    color: $green-600;
    border: 1px solid $green-600;
 
    &:hover {
      background-color: $green-600;
      color: #fff;
    }
  }
 
  &--end {
    background-color: $admin-font-color;
    color: #fff;
 
    &:hover {
      opacity: 0.85;
    }
  }
}
</style>