<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useModalStore } from '@/stores/modal';
import evaluationService from '@/services/evaluationService';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();
const lectureId = route.params.lectureId;

const form = reactive({
  score: 0,
  comment: '',
});

const isSubmitting = ref(false);

const setScore = (score) => {
  form.score = score;
};

const submit = async () => {
  if (!form.score) {
    await modal.showAlert('별점을 선택해주세요.');
    return;
  }
  if (!form.comment.trim()) {
    await modal.showAlert('수강평가를 작성해주세요.');
    return;
  }
  if (form.comment.length < 50) {
    await modal.showAlert('수강평가는 50자 이상 작성해주세요.');
    return;
  }

  try {
    isSubmitting.value = true;
    await evaluationService.createEvaluation(lectureId, {
      lectureId: Number(lectureId),
      score: form.score,
      comment: form.comment,
    });
    await modal.showAlert('강의평가가 등록되었습니다.');
    router.back();
  } catch (e) {
    await modal.showAlert('강의평가 등록에 실패했습니다.');
    console.error(e);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <button class="btn-back" @click="goBack">← 뒤로가기</button>
      <h2 class="page-title">강의평가 작성</h2>
    </div>

    <div class="form-card">
      <!-- 별점 -->
      <div class="form-row">
        <span class="label">강의 만족도</span>
        <div class="star-wrap">
          <span
            v-for="n in 5"
            :key="n"
            class="star"
            :class="{ active: n <= form.score }"
            @click="setScore(n)"
          >★</span>
          <span class="score-text">{{ form.score }}.0 / 5.0</span>
        </div>
      </div>

      <!-- 수강평가 -->
      <div class="form-row column">
        <span class="label">수강평가</span>
        <textarea
          v-model="form.comment"
          class="textarea"
          placeholder="50자 이상 작성해주세요."
          rows="6"
        />
        <span class="char-count">{{ form.comment.length }}자</span>
      </div>

      <!-- 버튼 -->
      <div class="btn-wrap">
        <button class="btn-cancel" @click="goBack">취소</button>
        <button class="btn-primary" @click="submit" :disabled="isSubmitting">
          {{ isSubmitting ? '제출 중...' : '제출' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 24px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.btn-back { background: none; border: none; cursor: pointer; color: var(--main-color); font-size: 14px; }
.page-title { font-size: 20px; font-weight: 600; }
.form-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; align-items: center; gap: 16px; }
.form-row.column { flex-direction: column; align-items: flex-start; }
.label { min-width: 100px; font-weight: 600; color: #555; }
.star-wrap { display: flex; align-items: center; gap: 4px; }
.star { font-size: 28px; cursor: pointer; color: #ddd; transition: color 0.1s; }
.star.active { color: #f5a623; }
.score-text { margin-left: 8px; font-size: 14px; color: #555; }
.textarea { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; resize: vertical; outline: none; }
.textarea:focus { border-color: var(--main-color); }
.char-count { font-size: 12px; color: #999; align-self: flex-end; }
.btn-wrap { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { padding: 8px 20px; background: #fff; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary { padding: 8px 20px; background: var(--main-color); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>