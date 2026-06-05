<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/common/DataTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import GradeService from '@/services/gradeService'
import { formatDateTime } from '@/utils/dateNumber';

const router     = useRouter()
const isLoading  = ref(false)
const appealList = ref([])
const selectedId = ref(null)

const selectedItem = computed(() =>
    appealList.value.find(a => a.courseId === selectedId.value) ?? null
)

const statusLabel = (s) => ({ PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }[s] ?? s)
const statusBadge = (s) => ({ PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }[s] ?? '')
const statusText  = (s) => ({ PENDING: 'text-pending', APPROVED: 'text-approved', REJECTED: 'text-rejected' }[s] ?? '')

const selectItem = (courseId) => {
    selectedId.value = selectedId.value === courseId ? null : courseId
}

onMounted(async () => {
    isLoading.value = true
    try {
        appealList.value = await GradeService.getStudentAppealList()
        console.log(appealList.value)
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

        <div class="split-layout">

            <!-- 목록 -->
            <div class="split-list">
                <DataTable
                    :columns="['강의명', '신청일', '상태']"
                    :rows="appealList"
                    :isLoading="isLoading"
                    gridCols="1fr 130px 80px"
                    emptyMessage="이의신청 내역이 없습니다.">
                    <article
                        v-for="item in appealList"
                        :key="item.courseId"
                        class="tbl-row pointer"
                        :class="{ 'row-selected': selectedId === item.courseId }"
                        @click="selectItem(item.courseId)">
                        <div>{{ item.lectureName }}</div>
                        <div class="tbl-meta">{{ formatDateTime(item.createdAt) }}</div>
                        <div>
                            <span :class="['text-badge', statusText(item.appealStatus)]">
                                {{ statusLabel(item.appealStatus) }}
                            </span>
                        </div>
                    </article>
                </DataTable>
            </div>

            <!-- 상세 -->
            <div class="split-detail">

                <template v-if="selectedItem">
                    <section class="card">
                        <p class="card-label">
                            <span>{{ selectedItem.lectureName }}</span>
                            <span :class="statusBadge(selectedItem.appealStatus)">
                                {{ statusLabel(selectedItem.appealStatus) }}
                            </span>
                        </p>

                        <!-- 메타 정보 -->
                        <div class="req-list">
                            <dl class="req-row"><dt>강의년도</dt><dd>{{ selectedItem.lectureYear }}년 {{ selectedItem.lectureSemester }}학기</dd></dl>
                            <dl class="req-row"><dt>신청일</dt><dd>{{ formatDate(selectedItem.createdAt) }}</dd></dl>
                            <dl v-if="selectedItem.processedAt" class="req-row full"><dt>처리일</dt><dd>{{ formatDate(selectedItem.processedAt) }}</dd></dl>
                        </div>

                        <!-- 신청 내용 -->
                        <p class="reason-text reason-body">{{ selectedItem.reason }}</p>
                        
                        <!-- 반려 사유 -->
                        <div
                            v-if="selectedItem.appealStatus === 'REJECTED' && selectedItem.rejectReason"
                            class="result-box rejected">
                            <p class="result-title">반려 사유</p>
                            <p class="result-body">{{ selectedItem.rejectReason }}</p>
                        </div>
                    </section>

                    <div class="page-footer">
                        <div class="action-group" style="margin-left: auto">
                            <button
                                v-if="selectedItem.appealStatus === 'REJECTED'"
                                class="btn btn-submit"
                                @click="router.push(`/grades/${selectedItem.courseId}/appeal`)">
                                <font-awesome-icon icon="fa-solid fa-paper-plane" /> 재신청
                            </button>
                        </div>
                    </div>
                </template>

                <!-- 선택 전 안내 -->
                <div v-else class="notice-panel card">
                    <h3 class="notice-title">성적 이의신청 내역</h3>
                    <p class="notice-desc">
                        좌측 목록에서 신청 내역을 클릭하면<br />
                        상세 내용을 확인할 수 있습니다.
                    </p>
                    <p class="notice-caution">반려된 신청은 이의신청 기간 내 재신청이 가능합니다.</p>
                </div>

            </div>
        </div>
    </div>
</template>

