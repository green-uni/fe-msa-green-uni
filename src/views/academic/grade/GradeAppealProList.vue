<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Pagination from '@/components/common/Pagination.vue'

const router      = useRouter()
const isLoading   = ref(true)
const appealList  = ref([])
const currentPage = ref(1)
const maxPage     = ref(1)

const statusLabel = (s) => ({ PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }[s] ?? s)
const statusText  = (s) => ({ PENDING: 'text-pending', APPROVED: 'text-approved', REJECTED: 'text-rejected' }[s] ?? '')

const formatDate = (dt) =>  dt ? new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'

const fetchList = async (page = 1) => {
    isLoading.value = true
    try {
        maxPage.value     = 1
        currentPage.value = page
        const res = await GradeService.getProfessorAppealList({ page, size: 10 })
        appealList.value  = res.content ?? []
        maxPage.value     = res.totalPages ?? 1
        currentPage.value = page
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
}

onMounted(() => fetchList(1))
</script>

<template>
    <div style="position: relative">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

        <DataTable
            :columns="['강의명', '학기', '학생', '신청일', '상태']"
            :rows="appealList"
            :isLoading="isLoading"
            gridCols="minmax(140px, 2fr) 100px minmax(120px, 1fr) 110px 80px"
            emptyMessage="이의신청 내역이 없습니다.">
            <article
                v-for="item in appealList"
                :key="item.courseId"
                class="tbl-row pointer"
                @click="router.push(`/professor/grades/appeals/${item.courseId}`)">
                <div class="tal">{{ item.lectureName }}</div>
                <div>{{ item.lectureYear }}년 {{ item.lectureSemester }}학기</div>
                <div>{{ item.studentName }}<small class="text-sub">{{ item.studentCode }}</small></div>
                <div>{{ formatDate(item.createdAt) }}</div>
                <div>
                    <span :class="['text-badge', statusText(item.appealStatus)]">
                        {{ statusLabel(item.appealStatus) }}
                    </span>
                </div>
            </article>
        </DataTable>

        <Pagination
            :currentPage="currentPage"
            :maxPage="maxPage"
            @goToPage="fetchList" />
    </div>
</template>
