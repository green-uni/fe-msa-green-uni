<script setup>
import { reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import evaluationService from '@/services/evaluationService';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const role = computed(() => authStore.role);
const lectureId = route.params.lectureId;

const state = reactive({
  detail: null,
});

const fetchDetail = async () => {
  try {
    let res;
    if (role.value === 'STUDENT') {
      res = await evaluationService.getStudentEvalDetail(lectureId);
    } else {
      res = await evaluationService.getProfessorEvalDetail(lectureId);
    }
    state.detail = res.data;
  } catch (e) {
    console.error(e);
  }
};

const moveToEdit = () => {
  router.push(`/evaluations/${lectureId}/edit`);
};

const goBack = () => {
  router.back();
};

onMounted(fetchDetail);
</script>

<template>
  <div class="page-wrap" v-if="state.detail">
    <div class="page-header">
      <button class="btn-back" @click="goBack">← 목록으로</button>
      <h2 class="page-title">강의평가 상세</h2>
    </div>

    <div class="detail-card">
      <div class="info-row">
        <span class="label">강의명</span>
        <span class="value">{{ state.detail.lectureName }}</span>
      </div>
      <div class="info-row">
        <span class="label">교수명</span>
        <span class="value">{{ state.detail.proName }}</span>
      </div>
      <div class="info-row">
        <span class="label">평가기간</span>
        <span class="value">{{ state.detail.startDate }} ~ {{ state.detail.endDate }}</span>
      </div>

      <!-- 학생 상세 -->
      <template v-if="role === 'STUDENT'">
        <div class="info-row">
          <span class="label">강의 만족도</span>
          <span class="value">{{ state.detail.score ?? '-' }} / 5.0</span>
        </div>
        <div class="info-row">
          <span class="label">수강평가</span>
          <span class="value">{{ state.detail.comment ?? '작성된 평가가 없습니다.' }}</span>
        </div>

        <!-- 미완료면 작성 버튼 -->
        <div class="btn-wrap" v-if="!state.detail.score">
          <button class="btn-primary" @click="moveToEdit">평가 작성하기</button>
        </div>
      </template>

      <!-- 교수 상세 -->
      <template v-else-if="role === 'PROFESSOR'">
        <div class="info-row">
          <span class="label">강의 만족도</span>
          <span class="value">{{ state.detail.score ? state.detail.score.toFixed(1) : '-' }} / 5.0</span>
        </div>
        <div class="info-row">
          <span class="label">평가참여인원</span>
          <span class="value">{{ state.detail.responseCount }} / {{ state.detail.totalStudents }}</span>
        </div>

        <!-- 수강평가 목록 -->
        <div class="comment-section">
          <span class="label">수강평가</span>
          <div class="comment-list" v-if="state.detail.comments?.length">
            <div
              class="comment-item"
              v-for="(comment, idx) in state.detail.comments"
              :key="idx"
            >
              {{ comment }}
            </div>
          </div>
          <p class="empty-text" v-else>작성된 수강평가가 없습니다.</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 24px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.btn-back { background: none; border: none; cursor: pointer; color: var(--main-color); font-size: 14px; }
.page-title { font-size: 20px; font-weight: 600; }
.detail-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.info-row { display: flex; gap: 16px; }
.label { min-width: 100px; font-weight: 600; color: #555; }
.value { color: #333; }
.comment-section { display: flex; flex-direction: column; gap: 8px; }
.comment-list { display: flex; flex-direction: column; gap: 8px; }
.comment-item { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; font-size: 14px; color: #333; }
.empty-text { color: #999; font-size: 14px; }
.btn-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-primary { padding: 8px 20px; background: var(--main-color); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
</style>