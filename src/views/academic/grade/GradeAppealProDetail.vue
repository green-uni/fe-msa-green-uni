<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import { useModalStore } from '@/stores/modal'

const route    = useRoute()
const router   = useRouter()
const modal    = useModalStore()
const courseId = route.params.courseId

const isLoading    = ref(true)
const isProcessing = ref(false)
const info         = ref(null)

// 처리 모드: null | 'reject' | 'approve'
const mode = ref(null)

// 반려 폼
const rejectReason = ref('')

// 승인 폼 (현재 점수 pre-fill)
const midScore        = ref(0)
const finScore        = ref(0)
const assignmentScore = ref(0)

const statusLabel = (s) => ({ PENDING: '검토 중', APPROVED: '승인', REJECTED: '반려' }[s] ?? s)
const statusClass = (s) => ({ PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' }[s] ?? '')

// 총점 미리보기 (출석점수는 서버에서 계산, 여기서는 현재값 기준 표시)
const previewTotal = () => {
    const mid   = Math.min(100, Math.max(0, midScore.value || 0))
    const fin   = Math.min(100, Math.max(0, finScore.value || 0))
    const asgn  = Math.min(100, Math.max(0, assignmentScore.value || 0))
    const attend = info.value?.attendScore ?? 0
    return Math.round(mid * 0.3 + fin * 0.3 + asgn * 0.2 + attend * 0.2)
}

const enterMode = (m) => {
    mode.value = m
    if (m === 'approve') {
        midScore.value        = info.value.midScore ?? 0
        finScore.value        = info.value.finScore ?? 0
        assignmentScore.value = info.value.assignmentScore ?? 0
    }
    if (m === 'reject') rejectReason.value = ''
}

const cancelMode = () => { mode.value = null }

const handleReject = async () => {
    if (!rejectReason.value.trim()) {
        await modal.showAlert('반려 사유를 입력해주세요.', 'warning')
        return
    }
    const confirmed = await modal.showConfirm('이의신청을 반려하시겠습니까?', 'warning')
    if (!confirmed) return

    isProcessing.value = true
    try {
        await GradeService.processAppeal(courseId, {
            status: 'REJECTED',
            rejectReason: rejectReason.value.trim()
        })
        await modal.showAlert('반려 처리가 완료되었습니다.', 'success')
        router.back()
    } catch {
    } finally {
        isProcessing.value = false
    }
}

const handleApprove = async () => {
    const confirmed = await modal.showConfirm('성적을 수정하고 이의신청을 승인하시겠습니까?', 'info')
    if (!confirmed) return

    isProcessing.value = true
    try {
        await GradeService.processAppeal(courseId, {
            status: 'APPROVED',
            midScore: midScore.value,
            finScore: finScore.value,
            assignmentScore: assignmentScore.value
        })
        await modal.showAlert('승인 처리가 완료되었습니다.', 'success')
        router.back()
    } catch {
    } finally {
        isProcessing.value = false
    }
}

onMounted(async () => {
    try {
        info.value = await GradeService.getProfessorAppealDetail(courseId)
    } catch {
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="detail-wrap">
        <div v-if="isLoading" class="loading-area">조회 중...</div>

        <template v-else-if="info">
            <div class="page-header">
                <button class="btn-back" @click="router.back()">← 목록으로</button>
                <h2 class="page-title">성적 이의신청 상세</h2>
                <span :class="['status-badge', statusClass(info.appealStatus)]">
                    {{ statusLabel(info.appealStatus) }}
                </span>
            </div>

            <div class="card-grid">
                <!-- 학생 정보 -->
                <section class="card">
                    <p class="card-label">학생 정보</p>
                    <div class="info-rows">
                        <div class="info-row">
                            <span class="ik">이름</span><span class="iv">{{ info.studentName ?? '-' }}</span>
                            <span class="ik">학번</span><span class="iv">{{ info.studentCode }}</span>
                        </div>
                        <div class="info-row">
                            <span class="ik">학과</span><span class="iv">{{ info.majorName ?? '-' }}</span>
                            <span class="ik">학년</span><span class="iv">{{ info.academicYear ?? '-' }}학년</span>
                        </div>
                    </div>
                </section>

                <!-- 강의 정보 -->
                <section class="card">
                    <p class="card-label">강의 정보</p>
                    <div class="info-rows">
                        <div class="info-row">
                            <span class="ik">강의명</span><span class="iv">{{ info.lectureName }}</span>
                            <span class="ik">개설연도</span>
                            <span class="iv">{{ info.lectureYear }}년 {{ info.lectureSemester }}학기</span>
                        </div>
                    </div>
                </section>
            </div>

            <!-- 이의신청 내용 -->
            <section class="card">
                <p class="card-label">이의신청 내용</p>
                <p class="reason-text">{{ info.reason }}</p>
                <div v-if="info.rejectReason" class="reject-reason-box">
                    <span class="reject-label">이전 반려 사유</span>
                    <span class="reject-text">{{ info.rejectReason }}</span>
                </div>
            </section>

            <!-- 현재 성적 -->
            <section class="card">
                <p class="card-label">현재 성적</p>
                <div class="score-grid">
                    <div class="score-item">
                        <p class="sl">중간 (30%)</p><p class="sv">{{ info.midScore }}점</p>
                    </div>
                    <div class="score-item">
                        <p class="sl">기말 (30%)</p><p class="sv">{{ info.finScore }}점</p>
                    </div>
                    <div class="score-item">
                        <p class="sl">과제 (20%)</p><p class="sv">{{ info.assignmentScore }}점</p>
                    </div>
                    <div class="score-item">
                        <p class="sl">출석 (20%)</p><p class="sv">{{ info.attendScore }}점</p>
                    </div>
                    <div class="score-item">
                        <p class="sl">총점</p><p class="sv highlight">{{ info.totalScore }}점</p>
                    </div>
                    <div class="score-item">
                        <p class="sl">등급</p><p class="sv highlight">{{ info.gradeLetter ?? '-' }}</p>
                    </div>
                </div>
            </section>

            <!-- 반려 폼 -->
            <section v-if="mode === 'reject'" class="card form-card">
                <p class="card-label">반려 사유 작성</p>
                <textarea
                    v-model="rejectReason"
                    class="textarea"
                    placeholder="반려 사유를 입력해주세요. (최대 200자)"
                    maxlength="200"
                    rows="5" />
                <div class="form-btn-row">
                    <button class="btn-confirm reject" :disabled="isProcessing" @click="handleReject">
                        {{ isProcessing ? '처리 중...' : '반려하기' }}
                    </button>
                    <button class="btn-cancel" @click="cancelMode">취소</button>
                </div>
            </section>

            <!-- 승인 폼 -->
            <section v-if="mode === 'approve'" class="card form-card">
                <p class="card-label">성적 수정 (승인)</p>
                <div class="score-edit-grid">
                    <div class="score-edit-item">
                        <label class="el">중간 (30%)</label>
                        <input v-model.number="midScore" type="number" min="0" max="100" class="score-input" />
                    </div>
                    <div class="score-edit-item">
                        <label class="el">기말 (30%)</label>
                        <input v-model.number="finScore" type="number" min="0" max="100" class="score-input" />
                    </div>
                    <div class="score-edit-item">
                        <label class="el">과제 (20%)</label>
                        <input v-model.number="assignmentScore" type="number" min="0" max="100" class="score-input" />
                    </div>
                    <div class="score-edit-item preview">
                        <label class="el">예상 총점</label>
                        <p class="preview-score">{{ previewTotal() }}점</p>
                    </div>
                </div>
                <p class="preview-note">* 출석 점수({{ info.attendScore }}점)는 자동 반영됩니다.</p>
                <div class="form-btn-row">
                    <button class="btn-confirm approve" :disabled="isProcessing" @click="handleApprove">
                        {{ isProcessing ? '처리 중...' : '승인 완료' }}
                    </button>
                    <button class="btn-cancel" @click="cancelMode">취소</button>
                </div>
            </section>

            <!-- 메인 버튼 (PENDING 상태이고 처리 모드가 아닐 때만 표시) -->
            <div v-if="info.appealStatus === 'PENDING' && !mode" class="action-row">
                <button class="btn-action reject"  @click="enterMode('reject')">반려하기</button>
                <button class="btn-action approve" @click="enterMode('approve')">승인 및 수정</button>
                <button class="btn-action close"   @click="router.back()">닫기</button>
            </div>

            <!-- 처리 완료 상태일 때 닫기만 표시 -->
            <div v-if="info.appealStatus !== 'PENDING'" class="action-row">
                <button class="btn-action close" @click="router.back()">닫기</button>
            </div>
        </template>
    </div>
</template>

<style scoped>
.detail-wrap { max-width: 800px; }
.loading-area { padding: 60px; text-align: center; color: var(--font-color-light); }

.page-header {
    display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
}
.btn-back {
    background: none; border: 1px solid var(--line-color); border-radius: 6px;
    padding: 6px 12px; font-size: var(--text-xs); color: var(--font-color-light);
    cursor: pointer; white-space: nowrap;
    &:hover { color: var(--font-color); }
}
.page-title { font-size: 1.3rem; font-weight: 700; flex: 1; }

.status-badge { padding: 5px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; }
.badge-pending  { background: #fff9c4; color: #e65100; }
.badge-approved { background: #c8e6c9; color: #1b5e20; }
.badge-rejected { background: #ffd0d0; color: #b71c1c; }

.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }

.card {
    background: #fff; border: 1px solid var(--line-color);
    border-radius: 10px; padding: 18px 20px; margin-bottom: 12px;
}
.card-label {
    font-size: var(--text-sm); font-weight: 700; color: var(--font-color);
    margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--line-color);
}

.info-rows { display: flex; flex-direction: column; gap: 8px; }
.info-row { display: grid; grid-template-columns: 70px 1fr 70px 1fr; gap: 4px 8px; font-size: 14px; }
.ik { color: var(--font-color-light); padding: 4px 0; }
.iv { color: var(--font-color); font-weight: 500; padding: 4px 8px; background: var(--default-bg); border-radius: 4px; }

.reason-text { font-size: 14px; color: var(--font-color); line-height: 1.7; white-space: pre-wrap; }
.reject-reason-box {
    margin-top: 14px; padding: 10px 14px; background: #fff5f5;
    border: 1px solid #ffd0d0; border-radius: 6px; display: flex; gap: 10px; font-size: 13px;
}
.reject-label { color: #b71c1c; font-weight: 700; white-space: nowrap; }
.reject-text  { color: var(--font-color); }

.score-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.score-item { background: var(--default-bg); border-radius: 8px; padding: 12px; text-align: center; }
.sl { font-size: 12px; color: var(--font-color-light); margin-bottom: 6px; }
.sv { font-size: 1.1rem; font-weight: 700; color: var(--font-color); }
.sv.highlight { color: var(--main-color); }

.form-card { border-color: var(--main-color); }
.textarea {
    width: 100%; box-sizing: border-box; border: 1px solid var(--line-color); border-radius: 6px;
    padding: 12px; font-size: 14px; font-family: inherit; resize: vertical; line-height: 1.6;
    &:focus { outline: none; border-color: var(--main-color); }
}
.score-edit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 10px; }
.score-edit-item { display: flex; flex-direction: column; gap: 6px; }
.el { font-size: 13px; color: var(--font-color-light); }
.score-input {
    border: 1px solid var(--line-color); border-radius: 6px; padding: 8px 10px;
    font-size: 14px; text-align: center; width: 100%; box-sizing: border-box;
    &:focus { outline: none; border-color: var(--main-color); }
}
.preview-score { font-size: 1.3rem; font-weight: 700; color: var(--main-color); padding: 6px 0; }
.preview-note { font-size: 12px; color: var(--font-color-light); margin-bottom: 14px; }

.form-btn-row { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }
.btn-confirm {
    padding: 9px 24px; border: none; border-radius: 6px; font-size: var(--text-sm);
    font-weight: 700; cursor: pointer;
    &.reject  { background: #c62828; color: #fff; &:hover { opacity: 0.88; } }
    &.approve { background: var(--main-color); color: #fff; &:hover { opacity: 0.88; } }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn-cancel {
    padding: 9px 20px; background: #fff; color: var(--font-color-light);
    border: 1px solid var(--line-color); border-radius: 6px; font-size: var(--text-sm);
    cursor: pointer; &:hover { color: var(--font-color); }
}

.action-row { display: flex; gap: 12px; justify-content: flex-end; margin-top: 4px; }
.btn-action {
    padding: 10px 24px; border-radius: 6px; font-size: var(--text-sm);
    font-weight: 700; cursor: pointer; border: none;
    &.reject  { background: #fff; border: 1px solid #c62828; color: #c62828;
                &:hover { background: #c62828; color: #fff; } }
    &.approve { background: var(--main-color); color: #fff; &:hover { opacity: 0.88; } }
    &.close   { background: #fff; border: 1px solid var(--line-color); color: var(--font-color-light);
                &:hover { color: var(--font-color); } }
}
</style>
