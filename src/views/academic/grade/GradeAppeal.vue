<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import { useModalStore } from '@/stores/modal'

const route   = useRoute()
const router  = useRouter()
const modal   = useModalStore()
const gradeId = route.params.gradeId

const isLoading   = ref(true)
const isSubmitting = ref(false)
const info        = ref(null)

// 폼 입력값
const reason = ref('')
const MAX_LEN = 1000

const charCount = ref(0)
const onInput = () => { charCount.value = reason.value.length }

onMounted(async () => {
    try {
        info.value = await GradeService.getAppealInfo(gradeId)
        // 반려된 이의신청 재신청 시 기존 내용 미리 채우기
        if (info.value.existingReason) {
            reason.value  = info.value.existingReason
            charCount.value = reason.value.length
        }
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isLoading.value = false
    }
})

const handleSubmit = async () => {
    if (!reason.value.trim()) {
        await modal.showAlert('이의신청 내용을 입력해주세요.', 'warning')
        return
    }
    const confirmed = await modal.showConfirm('이의를 신청하시겠습니까?', 'info')
    if (!confirmed) return

    isSubmitting.value = true
    try {
        await GradeService.submitAppeal(gradeId, reason.value.trim())
        await modal.showAlert('이의신청이 완료되었습니다.', 'success')
        router.back()
    } catch {
        // 에러 모달은 httpRequester 인터셉터가 처리
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="appeal-wrap">

        <div v-if="isLoading" class="loading-area">조회 중...</div>

        <template v-else-if="info">

            <div class="page-header">
                <h2 class="page-title">성적 이의신청</h2>
            </div>

            <div class="form-card">

                <!-- 강의 정보 -->
                <section class="section">
                    <p class="section-title">강의 정보</p>
                    <div class="info-table">
                        <div class="info-row">
                            <span class="info-key">강의명</span>
                            <span class="info-val">{{ info.lectureName }}</span>
                            <span class="info-key">강의개설연도</span>
                            <span class="info-val">{{ info.lectureYear }}년 {{ info.lectureSemester }}학기</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">교수명</span>
                            <span class="info-val">{{ info.professorName ?? '-' }}</span>
                            <span class="info-key"></span>
                            <span class="info-val"></span>
                        </div>
                    </div>
                </section>

                <!-- 작성자 정보 -->
                <section class="section">
                    <p class="section-title">작성자 정보</p>
                    <div class="info-table">
                        <div class="info-row">
                            <span class="info-key">학과</span>
                            <span class="info-val">{{ info.majorName ?? '-' }}</span>
                            <span class="info-key">학번</span>
                            <span class="info-val">{{ info.memberCode }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-key">학년</span>
                            <span class="info-val">{{ info.academicYear ?? '-' }}학년</span>
                            <span class="info-key">이름</span>
                            <span class="info-val">{{ info.studentName ?? '-' }}</span>
                        </div>
                    </div>
                </section>

                <!-- 이의신청 유형 -->
                <section class="section">
                    <p class="section-title">이의신청 유형</p>
                    <label class="radio-label">
                        <input type="radio" name="appealType" checked readonly />
                        성적 오류
                    </label>
                </section>

                <!-- 이의신청 내용 -->
                <section class="section">
                    <p class="section-title">
                        이의신청 내용
                        <span class="char-count">{{ charCount }} / {{ MAX_LEN }}자</span>
                    </p>
                    <textarea
                        v-model="reason"
                        class="content-area"
                        :maxlength="MAX_LEN"
                        placeholder="이의신청 내용을 입력해주세요. (최대 1000자)"
                        rows="10"
                        @input="onInput"
                    />
                </section>

                <!-- 버튼 -->
                <div class="btn-row">
                    <button class="btn-submit" :disabled="isSubmitting" @click="handleSubmit">
                        {{ isSubmitting ? '신청 중...' : '신청하기' }}
                    </button>
                    <button class="btn-cancel" @click="router.back()">돌아가기</button>
                </div>

            </div>
        </template>
    </div>
</template>

<style scoped>
.appeal-wrap { max-width: 800px; }

.loading-area { padding: 60px; text-align: center; color: var(--font-color-light); }

.page-header { margin-bottom: 20px; }
.page-title  { font-size: 1.3rem; font-weight: 700; }

.form-card {
    background: #fff;
    border: 1px solid var(--line-color);
    border-radius: 10px;
    overflow: hidden;
}

/* 섹션 */
.section {
    padding: 18px 24px;
    border-bottom: 1px solid var(--line-color);
    &:last-child { border-bottom: none; }
}
.section-title {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--font-color);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.char-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--font-color-light);
    margin-left: auto;
}

/* 정보 테이블 */
.info-table { display: flex; flex-direction: column; gap: 8px; }
.info-row {
    display: grid;
    grid-template-columns: 90px 1fr 90px 1fr;
    gap: 4px 8px;
    font-size: 14px;
}
.info-key {
    color: var(--font-color-light);
    padding: 6px 0;
}
.info-val {
    color: var(--font-color);
    font-weight: 500;
    padding: 6px 10px;
    background: var(--default-bg);
    border-radius: 4px;
}

/* 유형 라디오 */
.radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--font-color);
    cursor: pointer;
}
.radio-label input { accent-color: var(--main-color); width: 16px; height: 16px; }

/* 내용 textarea */
.content-area {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line-color);
    border-radius: 6px;
    padding: 12px;
    font-size: 14px;
    color: var(--font-color);
    resize: vertical;
    line-height: 1.6;
    font-family: inherit;
    &:focus { outline: none; border-color: var(--main-color); }
}

/* 버튼 행 */
.btn-row {
    padding: 18px 24px;
    display: flex;
    justify-content: center;
    gap: 12px;
    border-top: 1px solid var(--line-color);
}
.btn-submit {
    padding: 10px 32px;
    background: var(--main-color);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: var(--text-sm);
    font-weight: 700;
    cursor: pointer;
    &:hover:not(:disabled) { opacity: 0.88; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.btn-cancel {
    padding: 10px 32px;
    background: #fff;
    color: var(--font-color-light);
    border: 1px solid var(--line-color);
    border-radius: 6px;
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    &:hover { border-color: var(--font-color-light); color: var(--font-color); }
}
</style>
