<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'

const router    = useRouter()
const isLoading = ref(true)
const appealList = ref([])

const statusLabel = (status) => {
    const map = { PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }
    return map[status] ?? status
}

const statusClass = (status) => {
    const map = { PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }
    return map[status] ?? ''
}

const formatDate = (datetime) => {
    if (!datetime) return '-'
    return new Date(datetime).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    })
}

onMounted(async () => {
    try {
        appealList.value = await GradeService.getStudentAppealList()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="appeal-list-wrap">

        <div v-if="isLoading" class="loading-area">조회 중...</div>

        <template v-else>
            <div v-if="!appealList.length" class="empty-area">이의신청 내역이 없습니다.</div>

            <div v-else class="list">
                <article
                    v-for="item in appealList"
                    :key="item.courseId"
                    class="appeal-card">

                    <!-- 카드 헤더 -->
                    <div class="card-header">
                        <div class="lecture-info">
                            <span class="lecture-name">{{ item.lectureName }}</span>
                            <span class="lecture-term">{{ item.lectureYear }}년 {{ item.lectureSemester }}학기</span>
                        </div>
                        <span :class="['status-badge', statusClass(item.appealStatus)]">
                            {{ statusLabel(item.appealStatus) }}
                        </span>
                    </div>

                    <!-- 신청 내용 -->
                    <div class="card-body">
                        <p class="content-text">{{ item.reason }}</p>
                    </div>

                    <!-- 반려 사유 -->
                    <div v-if="item.appealStatus === 'REJECTED' && item.rejectReason" class="reject-reason">
                        <span class="reject-label">반려 사유</span>
                        <span class="reject-text">{{ item.rejectReason }}</span>
                    </div>

                    <!-- 카드 푸터 -->
                    <div class="card-footer">
                        <span class="date-info">신청일: {{ formatDate(item.createdAt) }}</span>
                        <span v-if="item.processedAt" class="date-info">
                            처리일: {{ formatDate(item.processedAt) }}
                        </span>
                        <button
                            v-if="item.appealStatus === 'REJECTED'"
                            class="btn-reapply"
                            @click="router.push(`/grades/${item.courseId}/appeal`)">
                            재신청
                        </button>
                    </div>

                </article>
            </div>
        </template>
    </div>
</template>

<style scoped>
.appeal-list-wrap { max-width: 720px; }

.loading-area, .empty-area {
    padding: 60px;
    text-align: center;
    color: var(--font-color-light);
}

.list { display: flex; flex-direction: column; gap: 12px; }

/* 카드 */
.appeal-card {
    background: #fff;
    border: 1px solid var(--line-color);
    border-radius: 10px;
    overflow: hidden;
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

/* 상태 배지 */
.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
}
.badge-pending  { background: #fff9c4; color: #e65100; }
.badge-approved { background: #c8e6c9; color: #1b5e20; }
.badge-rejected { background: #ffd0d0; color: #b71c1c; }

/* 내용 */
.card-body { padding: 14px 18px; }
.content-text {
    font-size: 14px;
    color: var(--font-color);
    line-height: 1.6;
    white-space: pre-wrap;
}

/* 반려 사유 */
.reject-reason {
    margin: 0 18px 12px;
    padding: 10px 14px;
    background: #fff5f5;
    border: 1px solid #ffd0d0;
    border-radius: 6px;
    display: flex;
    gap: 10px;
    font-size: 13px;
}
.reject-label { color: #b71c1c; font-weight: 700; white-space: nowrap; }
.reject-text  { color: var(--font-color); }

/* 푸터 */
.card-footer {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 18px;
    border-top: 1px solid var(--line-color);
}
.date-info { font-size: 12px; color: var(--font-color-light); }

.btn-reapply {
    margin-left: auto;
    padding: 5px 14px;
    border: 1px solid #c62828;
    border-radius: 4px;
    background: #fff;
    color: #c62828;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    &:hover { background: #c62828; color: #fff; }
}
</style>