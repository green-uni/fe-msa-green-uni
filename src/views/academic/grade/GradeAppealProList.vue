<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'

const router     = useRouter()
const isLoading  = ref(true)
const appealList = ref([])

const statusLabel = (s) => ({ PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }[s] ?? s)
const statusClass = (s) => ({ PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }[s] ?? '')

const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('ko-KR',
    { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'

onMounted(async () => {
    try {
        appealList.value = await GradeService.getProfessorAppealList()
    } catch {
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="appeal-list-wrap">
        <div v-if="isLoading" class="empty-area">조회 중...</div>
        <template v-else>
            <div v-if="!appealList.length" class="empty-area">이의신청 내역이 없습니다.</div>
            <div v-else class="list">
                <article
                    v-for="item in appealList"
                    :key="item.courseId"
                    class="appeal-card"
                    @click="router.push(`/professor/grades/appeals/${item.courseId}`)">
                    <div class="card-header">
                        <div class="lecture-info">
                            <span class="lecture-name">{{ item.lectureName }}</span>
                            <span class="lecture-term">{{ item.lectureYear }}년 {{ item.lectureSemester }}학기</span>
                        </div>
                        <span :class="['status-badge', statusClass(item.appealStatus)]">
                            {{ statusLabel(item.appealStatus) }}
                        </span>
                    </div>
                    <div class="card-body">
                        <span class="student-info">{{ item.studentName }} ({{ item.studentCode }})</span>
                        <p class="reason-text">{{ item.reason }}</p>
                    </div>
                    <div class="card-footer">
                        <span class="date-info">신청일: {{ formatDate(item.createdAt) }}</span>
                        <span class="arrow">상세보기 →</span>
                    </div>
                </article>
            </div>
        </template>
    </div>
</template>

<style scoped>
.appeal-list-wrap { max-width: 720px; }
.empty-area { padding: 60px; text-align: center; color: var(--font-color-light); }
.list { display: flex; flex-direction: column; gap: 12px; }

.appeal-card {
    background: #fff;
    border: 1px solid var(--line-color);
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 0.15s;
    &:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
}
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid var(--line-color);
    background: var(--default-bg);
}
.lecture-info { display: flex; align-items: center; gap: 10px; }
.lecture-name { font-size: var(--text-sm); font-weight: 700; color: var(--font-color); }
.lecture-term { font-size: var(--text-xs); color: var(--font-color-light); }

.status-badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
.badge-pending  { background: #fff9c4; color: #e65100; }
.badge-approved { background: #c8e6c9; color: #1b5e20; }
.badge-rejected { background: #ffd0d0; color: #b71c1c; }

.card-body { padding: 14px 18px; }
.student-info { font-size: 13px; color: var(--font-color-light); margin-bottom: 6px; display: block; }
.reason-text {
    font-size: 14px; color: var(--font-color); line-height: 1.5;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 18px;
    border-top: 1px solid var(--line-color);
}
.date-info { font-size: 12px; color: var(--font-color-light); }
.arrow { font-size: 12px; color: var(--main-color); font-weight: 600; }
</style>
