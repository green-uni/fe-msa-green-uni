<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import GradeService from '@/services/gradeService'
import { useRouter } from 'vue-router'

const router = useRouter()

const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2

const allLectures      = ref([])
const isLoading        = ref(true)
const selectedYear     = ref(currentYear)
const selectedSemester = ref(currentSemester)

const yearOptions = computed(() =>
  [...new Set(allLectures.value.map(l => l.year))].sort((a, b) => b - a)
)

const lectures = computed(() =>
  allLectures.value.filter(lec => {
    const matchYear     = !selectedYear.value     || lec.year     === selectedYear.value
    const matchSemester = !selectedSemester.value || lec.semester === selectedSemester.value
    return matchYear && matchSemester
  })
)

const isCurrent = (lec) =>
  lec.year === currentYear && lec.semester === currentSemester

function resetFilter() {
  selectedYear.value     = currentYear
  selectedSemester.value = currentSemester
}

onMounted(async () => {
  try {
    allLectures.value = await GradeService.getProfessorLectures()
  } catch {
    // 에러 모달은 httpRequester 인터셉터가 처리
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div style="position: relative">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

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
      :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년']"
      :rows="lectures"
      gridCols="minmax(160px,2fr) minmax(100px,1fr) minmax(120px,1.2fr) minmax(110px,1fr)"
      :isLoading="isLoading"
      emptyMessage="담당 중인 강의가 없습니다.">
      <article
        v-for="lecture in lectures"
        :key="lecture.lectureId"
        class="tbl-row pointer"
        :class="{ 'row--past': !isCurrent(lecture) }"
        @click="router.push(`/professor/grades/${lecture.lectureId}`)">
        <div>{{ lecture.lectureName }}</div>
        <div>{{ lecture.lectureType }}</div>
        <div>{{ lecture.year }}년 {{ lecture.semester }}학기</div>
        <div>{{ lecture.credit }}학점 / {{ lecture.academicYear }}학년</div>
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
.row--past {
  opacity: 0.65;
}
</style>