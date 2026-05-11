<template>
  <div class="prof-lecture-page">
    <h2 class="page-title">내 강의 목록</h2>

    <div v-if="isLoading" class="loading">강의 목록을 불러오는 중...</div>

    <div v-else-if="lectures.length === 0" class="empty">
      <p>현재 담당 중인 강의가 없습니다.</p>
    </div>

    <div v-else class="lecture-list">
      <div v-for="lecture in lectures" :key="lecture.lectureId" class="lecture-card">

        <div class="card-header">
          <span class="type-badge">{{ lecture.lectureType }}</span>
          <span class="lecture-name">{{ lecture.lectureName }}</span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">학년도/학기</span>
            <span class="value">{{ lecture.year }}년 {{ lecture.semester }}학기</span>
          </div>
          <div class="info-row">
            <span class="label">학점 / 대상학년</span>
            <span class="value">{{ lecture.credit }}학점 / {{ lecture.academicYear }}학년</span>
          </div>
          <div v-for="(sch, i) in lecture.schedules" :key="i" class="info-row">
            <span class="label">{{ i === 0 ? '강의실' : '' }}</span>
            <span class="value">
              {{ sch.dayOfWeek }}요일 {{ sch.startPeriod }}-{{ sch.endPeriod }}교시 · {{ sch.lectureRoom }}
            </span>
          </div>
        </div>

        <div class="card-footer">
          <button class="btn btn-list" @click="$router.push(`/attendances/roster`)">
            출석 현황
          </button>
          <button class="btn btn-qr" @click="$router.push(`/attendances/${lecture.lectureId}/qr`)">
            QR 출석 관리
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import attendanceService from '@/services/attendanceService.js'

const lectures = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } catch {
    // 에러 모달은 httpRequester 인터셉터가 처리
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.prof-lecture-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin-bottom: 24px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 0;
  color: #888;
  font-size: 15px;
}

.lecture-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lecture-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.card-header {
  background: #f0f4ff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #dde5ff;
}

.type-badge {
  background: #4a7cf7;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.lecture-name {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.card-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.label {
  width: 90px;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.value {
  font-size: 14px;
  color: #333;
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 9px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover { opacity: 0.85; }

  &.btn-qr {
    background: #4a7cf7;
    color: #fff;
  }

  &.btn-list {
    background: #f0f0f0;
    color: #555;
  }
}
</style>