<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import GradeService from '@/services/gradeService'
import { useRouter } from 'vue-router'

const router = useRouter()
const lectures = ref([])
const isLoading = ref(true)

onMounted(async () => {
    try {
        lectures.value = await GradeService.getProfessorLectures()
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
    <DataTable
        :columns="['강의명', '유형', '학년도', '학기', '학점', '대상학년', '수강인원']"
        :rows="lectures"
        gridCols="minmax(160px,2fr) 100px 80px 70px 70px 80px 90px"
        :isLoading="isLoading"
        emptyMessage="담당 중인 강의가 없습니다.">

        <article
            v-for="lecture in lectures"
            :key="lecture.lectureId"
            class="tbl-row pointer"
            @click="router.push(`/professor/grades/${lecture.lectureId}`)">
            <div>{{ lecture.lectureName }}</div>
            <div>{{ lecture.lectureType }}</div>
            <div>{{ lecture.year }}년</div>
            <div>{{ lecture.semester }}학기</div>
            <div>{{ lecture.credit }}학점</div>
            <div>{{ lecture.academicYear }}학년</div>
            <div>{{ lecture.maxStd != null ? lecture.maxStd + '명' : '-' }}</div>
        </article>
    </DataTable>
    </div>
</template>