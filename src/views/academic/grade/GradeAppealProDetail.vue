<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useModalStore } from '@/stores/modal'

const route    = useRoute()
const router   = useRouter()
const modal    = useModalStore()
const courseId = route.params.courseId

const isLoading = ref(true)
const info      = ref(null)

const isPending = computed(() => info.value?.appealStatus === 'PENDING')

const showRejectBox  = ref(false)
const showApproveBox = ref(false)
const rejectReason    = ref('')
const midScore        = ref(0)
const finScore        = ref(0)
const assignmentScore = ref(0)

const statusClass = (s) => ({ PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }[s] ?? '')
const statusLabel = (s) => ({ PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }[s] ?? s)

const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'

const previewTotal = () => {
    const mid    = Math.min(100, Math.max(0, midScore.value || 0))
    const fin    = Math.min(100, Math.max(0, finScore.value || 0))
    const asgn   = Math.min(100, Math.max(0, assignmentScore.value || 0))
    const attend = info.value?.attendScore ?? 0
    return Math.round(mid * 0.3 + fin * 0.3 + asgn * 0.2 + attend * 0.2)
}

const openRejectBox = () => { showRejectBox.value = true; rejectReason.value = '' }
const openApproveBox = () => {
    showApproveBox.value  = true
    midScore.value        = info.value.midScore ?? 0
    finScore.value        = info.value.finScore ?? 0
    assignmentScore.value = info.value.assignmentScore ?? 0
}

const handleReject = async () => {
    if (!rejectReason.value.trim()) {
        await modal.showAlert('반려 사유를 입력해주세요.', 'warning')
        return
    }
    const confirmed = await modal.showConfirm('이의신청을 반려하시겠습니까?', 'warning')
    if (!confirmed) return
    try {
        await GradeService.processAppeal(courseId, { status: 'REJECTED', rejectReason: rejectReason.value.trim() })
        await modal.showAlert('반려 처리가 완료되었습니다.', 'success')
        router.back()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    }
}

const handleApprove = async () => {
    const confirmed = await modal.showConfirm('성적을 수정하고 이의신청을 승인하시겠습니까?', 'info')
    if (!confirmed) return
    try {
        await GradeService.processAppeal(courseId, { status: 'APPROVED', midScore: midScore.value, finScore: finScore.value, assignmentScore: assignmentScore.value })
        await modal.showAlert('승인 처리가 완료되었습니다.', 'success')
        router.back()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    }
}

onMounted(async () => {
    try {
        info.value = await GradeService.getProfessorAppealDetail(courseId)
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="detail-wrap">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

        <template v-if="!isLoading && info">

            <!-- 학생 / 강의 정보 -->
            <div class="card-grid">
                <section class="card">
                    <p class="card-label">학생 정보</p>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-key">이름</span>
                            <span class="info-val">{{ info.studentName ?? '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-key">학번</span>
                            <span class="info-val">{{ info.studentCode }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-key">학과</span>
                            <span class="info-val">{{ info.majorName ?? '-' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-key">학년</span>
                            <span class="info-val">{{ info.academicYear ?? '-' }}학년</span>
                        </div>
                    </div>
                </section>
                <section class="card">
                    <p class="card-label">강의 정보</p>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-key">강의명</span>
                            <span class="info-val">{{ info.lectureName }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-key">개설연도</span>
                            <span class="info-val">{{ info.lectureYear }}년 {{ info.lectureSemester }}학기</span>
                        </div>
                    </div>
                </section>
            </div>

            <!-- 이의신청 내용 -->
            <section class="card">
                <p class="card-label">
                    이의신청 내용
                    <span :class="statusClass(info.appealStatus)">{{ statusLabel(info.appealStatus) }}</span>
                </p>
                <div class="info-grid" style="margin-bottom: 14px">
                    <div class="info-item">
                        <span class="info-key">신청일</span>
                        <span class="info-val">{{ formatDate(info.createdAt) }}</span>
                    </div>
                    <div v-if="info.processedAt" class="info-item">
                        <span class="info-key">처리일</span>
                        <span class="info-val">{{ formatDate(info.processedAt) }}</span>
                    </div>
                </div>
                <p class="reason-text reason-body">{{ info.reason }}</p>
                <div v-if="info.rejectReason" class="result-box rejected">
                    <p class="result-title">이전 반려 사유</p>
                    <p class="result-body">{{ info.rejectReason }}</p>
                </div>
            </section>

            <!-- 현재 성적 -->
            <section class="card">
                <p class="card-label">현재 성적</p>
                <div class="summary-bar">
                    <div class="summary-item">
                        <p class="summary-label">중간 (30%)</p>
                        <p class="summary-value">{{ info.midScore }}<span class="summary-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">기말 (30%)</p>
                        <p class="summary-value">{{ info.finScore }}<span class="summary-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">과제 (20%)</p>
                        <p class="summary-value">{{ info.assignmentScore }}<span class="summary-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">출석 (20%)</p>
                        <p class="summary-value">{{ info.attendScore }}<span class="summary-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">총점</p>
                        <p class="summary-value">{{ info.totalScore }}<span class="summary-unit">점</span></p>
                    </div>
                    <div class="summary-item">
                        <p class="summary-label">등급</p>
                        <p class="summary-value">{{ info.gradeLetter ?? '-' }}</p>
                    </div>
                </div>
            </section>

            <!-- 반려 폼 -->
            <div v-if="showRejectBox" class="action-box reject">
                <p class="action-box-title">반려 사유 작성</p>
                <textarea v-model="rejectReason" class="action-textarea"
                    placeholder="반려 사유를 입력해주세요. (최대 200자)"
                    maxlength="200" rows="4" />
                <div class="action-box-footer">
                    <span class="char-count">{{ rejectReason.length }} / 200자</span>
                    <div class="action-buttons">
                        <button class="btn btn-default" @click="showRejectBox = false">취소</button>
                        <button class="btn btn-default" @click="handleReject">반려 처리</button>
                    </div>
                </div>
            </div>

            <!-- 승인 폼 -->
            <div v-if="showApproveBox" class="action-box approve">
                <p class="action-box-title">성적 수정 (승인)</p>
                <div class="score-edit-grid">
                    <div class="score-edit-item">
                        <label class="summary-label">중간 (30%)</label>
                        <input v-model.number="midScore" type="number" min="0" max="100" class="tbl-input" />
                    </div>
                    <div class="score-edit-item">
                        <label class="summary-label">기말 (30%)</label>
                        <input v-model.number="finScore" type="number" min="0" max="100" class="tbl-input" />
                    </div>
                    <div class="score-edit-item">
                        <label class="summary-label">과제 (20%)</label>
                        <input v-model.number="assignmentScore" type="number" min="0" max="100" class="tbl-input" />
                    </div>
                    <div class="score-edit-item">
                        <label class="summary-label">출석 (20%) / 자동반영</label>
                        {{ info.attendScore }}
                    </div>
                    <div class="score-edit-item">
                        <label class="summary-label">예상 총점</label>
                        <p class="preview-score">{{ previewTotal() }}점</p>
                    </div>
                </div>
                    <div class="action-buttons">
                        <button class="btn btn-default" @click="showApproveBox = false">취소</button>
                        <button class="btn btn-submit" @click="handleApprove">승인 처리</button>
                    </div>
            </div>

            <!-- 하단 버튼 -->
            <div class="page-footer">
                <button class="btn btn-default" @click="router.back()"><font-awesome-icon icon="fa-solid fa-list" /> 목록</button>
                <div v-if="isPending && !showRejectBox && !showApproveBox" class="action-group">
                    <button class="btn btn-default" @click="openRejectBox">반려하기</button>
                    <button class="btn btn-default" @click="openApproveBox">승인 및 수정</button>
                </div>
            </div>

        </template>
    </div>
</template>

<style scoped lang="scss">
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px;}
.score-edit-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;}
.score-edit-item { display: flex; flex-direction: column; gap: 8px; }
.preview-score   { font-weight: 700; color: $green-600;}
</style>
