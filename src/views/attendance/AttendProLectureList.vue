<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import attendanceService from '@/services/attendanceService.js'

const router    = useRouter()
const lectures  = ref([])
const isLoading = ref(true)

const now             = new Date()
const currentYear     = now.getFullYear()
const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2

const LECTURE_TYPE = {
  GENERAL_REQUIRED: '교양필수', GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',   MAJOR_ELECTIVE: '전공선택',
}
const typeLabel = (code) => LECTURE_TYPE[code] ?? code

const scheduleText = (schedules) => {
  if (!schedules?.length) return '-'
  return schedules.map(s => `${s.dayOfWeek}요일 ${s.startPeriod}-${s.endPeriod}교시 · ${s.lectureRoom}`).join('\n')
}

const isCurrent = (lecture) =>
  lecture.year === currentYear && lecture.semester === currentSemester


onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = (res.data ?? res).filter(lec => isCurrent(lec))
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

    <div class="list-header">
      <div class="list-header-box">
        <p>현재 학기 <strong>{{ currentYear }}</strong>년 <strong>{{ currentSemester }}</strong>학기</p>
      </div>
    </div>
    <DataTable
      :columns="['강의명', '유형', '학년도', '학기', '학점', '대상학년', '강의실', '관리']"
      :rows="lectures"
      gridCols="minmax(160px,2fr) minmax(80px,.5fr) minmax(80px,.5fr) minmax(70px,.5fr) minmax(70px,.5fr) minmax(80px,.5fr) minmax(200px,2.5fr) minmax(100px,.5fr)"
      :isLoading="isLoading"
      emptyMessage="담당 중인 강의가 없습니다.">
      <article
        v-for="lecture in lectures"
        :key="lecture.lectureId"
        class="tbl-row"
        :class="{ 'row--sample': !isCurrent(lecture) }">
        <div>{{ lecture.lectureName }}</div>
        <div>{{ typeLabel(lecture.lectureType) }}</div>
        <div>{{ lecture.year }}년</div>
        <div>{{ lecture.semester }}학기</div>
        <div>{{ lecture.credit }}학점</div>
        <div>{{ lecture.academicYear }}학년</div>
        <div>{{ scheduleText(lecture.schedules) }}</div>
        <div>
          <button class="btn btn-submit btn-sm" @click.stop="router.push(`/attendances/${lecture.lectureId}/qr`)">
            QR 출석
          </button>
        </div>
      </article>
    </DataTable>
  </div>
</template>
