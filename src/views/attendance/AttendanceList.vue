<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import attendanceService from '@/services/attendanceService.js'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()

// ── 현재 학기 ────────────────────────────────────────────────
const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2

// ── 전체 강의 + 필터 상태 ────────────────────────────────────
const allLectures      = ref([])
const isLectureLoading = ref(true)
const selectedYear     = ref(currentYear)
const selectedSemester = ref(currentSemester)

// ── 연도 옵션 (불러온 강의에서 추출, 내림차순) ──────────────
const yearOptions = computed(() =>
  [...new Set(allLectures.value.map(l => l.year))].sort((a, b) => b - a)
)

// ── 필터링된 강의 목록 ────────────────────────────────────────
const lectures = computed(() =>
  allLectures.value.filter(lec => {
    const matchYear     = !selectedYear.value     || lec.year     === selectedYear.value
    const matchSemester = !selectedSemester.value || lec.semester === selectedSemester.value
    return matchYear && matchSemester
  })
)

// ── 강의 유형 / 강의실 헬퍼 ──────────────────────────────────
const LECTURE_TYPE = {
  GENERAL_REQUIRED: '교양필수', GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',   MAJOR_ELECTIVE: '전공선택',
}
const typeLabel = (code) => LECTURE_TYPE[code] ?? code

const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join('\n')
}

function resetFilter() {
  selectedYear.value     = currentYear
  selectedSemester.value = currentSemester
}

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    allLectures.value = res.data ?? res
  } finally {
    isLectureLoading.value = false
  }
})
</script>

<template>
  <div class="attendance-list-page">
    <LoadingSpinner v-if="isLectureLoading" :overlay="true" size="md" />

    <!-- 연도 / 학기 필터 -->
    <FilterBar :hasFilter="true" :showSearch="false" @reset="resetFilter">
      <select v-model="selectedYear" class="filter-select">
        <option value="">전체 연도</option>
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
      </select>
      <select v-model="selectedSemester" class="filter-select">
        <option value="">전체 학기</option>
        <option :value="1">1학기</option>
        <option :value="2">2학기</option>
      </select>
    </FilterBar>

    <DataTable
      :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실']"
      :rows="lectures"
      gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr)"
      :isLoading="isLectureLoading"
      emptyMessage="담당 강의가 없습니다.">
      <article
        v-for="lec in lectures"
        :key="lec.lectureId"
        class="tbl-row pointer"
        @click="router.push(`/attendances/${lec.lectureId}/roster`)">
        <div>{{ lec.lectureName }}</div>
        <div>{{ typeLabel(lec.lectureType) }}</div>
        <div>{{ lec.year }}년 {{ lec.semester }}학기</div>
        <div>{{ lec.credit }}학점 / {{ lec.academicYear }}학년</div>
        <div class="pre-line">{{ scheduleText(lec.schedules) }}</div>
      </article>
    </DataTable>
  </div>
</template>

<style scoped lang="scss">
.filter-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid $border-color;
  border-radius: 4px;
  font-size: $fs-sm;
  color: $font-color;
  cursor: pointer;
  background: #fff;
}
</style>