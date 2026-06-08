<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GradeService from '@/services/gradeService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useModalStore } from '@/stores/modal'

const route   = useRoute()
const router  = useRouter()
const modal   = useModalStore()
const gradeId = route.params.gradeId

const isLoading    = ref(true)
const isSubmitting = ref(false)
const info         = ref(null)

const reason    = ref('')
const MAX_LEN   = 1000
const charCount = ref(0)
const onInput   = () => { charCount.value = reason.value.length }

onMounted(async () => {
    try {
        info.value = await GradeService.getAppealInfo(gradeId)
        // 반려된 이의신청 재신청 시 기존 내용 미리 채우기
        if (info.value.existingReason) {
            reason.value    = info.value.existingReason
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
    <div style="position: relative">
        <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

        <template v-else-if="info">

            <!-- 강의 정보 -->
            <section class="card">
                <p class="card-label">강의 정보</p>
                <div class="req-list">
                    <dl class="req-row full"><dt>강의명</dt><dd>{{ info.lectureName }}</dd></dl>
                    <dl class="req-row"><dt>개설연도</dt><dd>{{ info.lectureYear }}년 {{ info.lectureSemester }}학기</dd></dl>
                    <dl class="req-row"><dt>교수명</dt><dd>{{ info.professorName ?? '-' }}</dd></dl>
                </div>
            </section>

            <!-- 이의신청 내용 -->
            <div class="form-wrap">
                <div class="content-wrap">
                    <h3>성적 이의신청</h3>
                    <div class="form-grid" style="--grid-cols: 1fr 1fr 1fr">
                        <div class="input-wrap">
                            <label class="input-label">이름</label>
                            <div class="input-content">
                                <input type="text" :value="info.studentName ?? '-'" disabled />
                            </div>
                        </div>
                        <div class="input-wrap">
                            <label class="input-label">학번</label>
                            <div class="input-content">
                                <input type="text" :value="info.memberCode" disabled />
                            </div>
                        </div>
                        <div class="input-wrap">
                            <label class="input-label">학과</label>
                            <div class="input-content">
                                <input type="text" :value="info.majorName ?? '-'" disabled />
                            </div>
                        </div>
                        <div class="input-wrap input-grid-full">
                            <label class="input-label">유형</label>
                            <div class="input-content">
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="appealType" checked readonly />
                                        성적 오류
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="input-wrap input-grid-full" style="align-items: flex-start">
                            <label class="input-label" style="padding-top: 10px">내용</label>
                            <div class="input-content">
                                <textarea
                                    v-model="reason"
                                    class="action-textarea"
                                    :maxlength="MAX_LEN"
                                    placeholder="이의신청 내용을 입력해주세요. (최대 1000자)"
                                    rows="10"
                                    @input="onInput"
                                />
                                <p class="char-count" style="text-align: right; margin-top: 4px">
                                    {{ charCount }} / {{ MAX_LEN }}자
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="page-footer">
                <button class="btn btn-default" @click="router.back()"><font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기</button>
                <button class="btn btn-submit" :disabled="isSubmitting" @click="handleSubmit">
                    <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isSubmitting ? '신청 중...' : '신청' }}
                </button>
            </div>

        </template>
    </div>
</template>
