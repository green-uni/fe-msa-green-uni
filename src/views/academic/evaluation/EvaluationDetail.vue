<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import evaluationService from '@/services/evaluationService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const modal = useModalStore();
const role = computed(() => authStore.role);

const lectureId = route.params.lectureId;

const isLoading = ref(false);
const detail = ref(null);

const hoverScore = ref(0);
const onStarHover = (n, e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  hoverScore.value = e.clientX < rect.left + rect.width / 2 ? n - 0.5 : n;
};
const onStarClick = (n, e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  evalForm.score = e.clientX < rect.left + rect.width / 2 ? n - 0.5 : n;
};

const QUESTIONS = [
  '강의는 규정 시간을 지키며 체계적으로 진행되었다.',
  '제공된 자료에 따라 진행되었으며 강의에 도움이 되었다.',
  '강의 난이도가 적절했으며 내용을 알기 쉽게 설명해주었다.',
  '강의가 전공 학습에 도움이 되었다.',
  '본 강의에 만족하며 다른 학생에게 권유하겠다.',
];

const CHOICES = [
  { label: 'A', value: 5 },
  { label: 'B', value: 4 },
  { label: 'C', value: 3 },
  { label: 'D', value: 2 },
  { label: 'E', value: 1 },
];

const evalForm = reactive({
  score: 0,
  q1: null, q2: null, q3: null, q4: null, q5: null,
  comment: '',
});

const getCurrentTerm = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    semester: now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8 ? 1 : 2,
  };
};

const getEvalStatus = (item) => {
  if (!item) return 'before';
  const today = new Date();
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  if (!start || !end) {
    const cur = getCurrentTerm();
    return (item.year < cur.year || (item.year === cur.year && item.semester < cur.semester))
      ? 'done'
      : 'before';
  }
  if (today < start) return 'before';
  if (today > end) return 'done';
  return 'active';
};

const evalStatus = computed(() => getEvalStatus(detail.value));

const fetchData = async () => {
  isLoading.value = true;
  try {
    const res = role.value === 'STUDENT'
      ? await evaluationService.getStudentEvalDetail(lectureId).catch(() => null)
      : await evaluationService.getProfessorEvalDetail(lectureId).catch(() => null);
    detail.value = res?.data ?? null;
  } finally {
    isLoading.value = false;
  }
};

const submitEval = async () => {
  if (!evalForm.score) { await modal.showAlert('전체 강의 만족도를 선택해주세요.', 'warning'); return; }
  if (!evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || !evalForm.q5) {
    await modal.showAlert('모든 문항에 응답해주세요.', 'warning'); return;
  }
  if (evalForm.comment.length < 10) { await modal.showAlert('수강평가를 10자 이상 작성해주세요.', 'warning'); return; }

  try {
    await evaluationService.createEvaluation(lectureId, {
      score: evalForm.score,
      q1: evalForm.q1, q2: evalForm.q2, q3: evalForm.q3, q4: evalForm.q4, q5: evalForm.q5,
      comment: evalForm.comment,
    });
    await modal.showAlert('강의평가가 등록되었습니다.', 'success');
    await fetchData();
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (dt) => dt ? dt.slice(0, 10) : '-';
const roundHalf = (v) => Math.round((v ?? 0) * 2) / 2;

onMounted(fetchData);
</script>

<template>
  <div style="position: relative">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <!-- 학생 상세 -->
    <template v-if="role === 'STUDENT'">
      <div v-if="evalStatus === 'before'" class="card">
        <p class="empty-text">진행중인 강의입니다. 강의평가 기간이 시작되지 않았습니다.</p>
      </div>

      <div v-else-if="evalStatus === 'active' && !detail?.hasGrade" class="card">
        <p class="empty-text">교수님이 성적을 입력한 후 강의평가가 가능합니다.</p>
      </div>

      <!-- 평가 작성 폼 -->
      <div v-else-if="evalStatus === 'active' && detail?.hasGrade && detail?.score == null" class="card">
        <div class="req-list">
          <dl class="req-row"><dt>강의명</dt><dd>{{ detail?.lectureName }}</dd></dl>
          <dl class="req-row"><dt>교수명</dt><dd>{{ detail?.proName }}</dd></dl>
          <dl class="req-row full">
            <dt>강의 만족도</dt>
            <dd>
              <div class="star-wrap">
                <span v-for="n in 5" :key="n" class="star-container"
                  @mousemove="onStarHover(n, $event)" @mouseleave="hoverScore = 0" @click="onStarClick(n, $event)">
                  <span class="star-half left" :class="{ active: (hoverScore || evalForm.score) >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: (hoverScore || evalForm.score) >= n }">★</span>
                </span>
                <span class="score-text">{{ evalForm.score.toFixed(1) }} / 5.0</span>
              </div>
            </dd>
          </dl>
        </div>
        <p class="survey-guide">
          본 설문은 수업 개선의 기초 및 교육의 질적인 향상을 위해 실시합니다.
          성실하게 작성하여 주시기 바랍니다.
        </p>
      <div class="tbl-scroll">
        <table class="data-tbl" style="margin-top: 14px;">
          <thead>
            <tr>
              <th>구분</th>
              <th>조사 항목</th>
              <th v-for="c in CHOICES" :key="c.label">
                {{ c.label }}<br/><span class="choice-score">{{ c.value }}점</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(q, idx) in QUESTIONS" :key="idx">
              <td class="tac">{{ idx + 1 }}</td>
              <td>{{ q }}</td>
              <td v-for="c in CHOICES" :key="c.label" class="tac vam">
                <input type="radio" :name="`q${idx + 1}`" :value="c.value" v-model="evalForm[`q${idx + 1}`]"/>
              </td>
            </tr>
            <tr>
              <td class="tac">6</td>
              <td colspan="6">
                <div class="free-text-label">그 외 하고 싶은 말을 적어주세요.</div>
                <textarea v-model="evalForm.comment" class="action-textarea" placeholder="10자 이상 작성해주세요." rows="4"/>
                <span class="char-count">{{ evalForm.comment.length }}자</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>

      <!-- 완료 조회 -->
      <div v-else-if="detail?.score != null" class="card">
        <div class="req-list">
          <dl class="req-row"><dt>강의명</dt><dd>{{ detail?.lectureName }}</dd></dl>
          <dl class="req-row"><dt>교수명</dt><dd>{{ detail?.proName }}</dd></dl>
          <dl class="req-row full">
            <dt>강의 만족도</dt>
            <dd>
              <div class="star-wrap readonly">
                <span v-for="n in 5" :key="n" class="star-container">
                  <span class="star-half left" :class="{ active: roundHalf(detail?.score) >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: roundHalf(detail?.score) >= n }">★</span>
                </span>
                <span class="score-text">{{ roundHalf(detail?.score).toFixed(1) }} / 5.0</span>
              </div>
            </dd>
          </dl>
        </div>
      <div class="tbl-scroll" style="margin-top: 14px;">
        <table class="data-tbl">
          <thead>
            <tr><th>구분</th><th>조사 항목</th><th>응답</th></tr>
          </thead>
          <tbody>
            <tr v-for="(q, idx) in QUESTIONS" :key="idx">
              <td class="tac">{{ idx + 1 }}</td>
              <td>{{ q }}</td>
              <td>{{ detail?.[`q${idx + 1}`] ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div style="margin-top: 14px;">
          <p class="section-title">한줄평</p>
          <div class="comment-box">{{ detail?.comment }}</div>
        </div>
      </div>

      <!-- 만료 + 미작성 -->
      <div v-else class="card">
        <p class="empty-text">평가 기간이 종료되어 더 이상 작성할 수 없습니다.</p>
      </div>
    </template>

    <!-- 교수 상세 -->
    <template v-else-if="role !== 'STUDENT' && detail">
      <div class="card">
        <div class="req-list">
          <dl class="req-row"><dt>강의명</dt><dd>{{ detail.lectureName }}</dd></dl>
          <dl class="req-row"><dt>교수명</dt><dd>{{ detail.proName }}</dd></dl>
          <dl class="req-row full">
            <dt>평가기간</dt>
            <dd>{{ formatDate(detail.startDate) }} ~ {{ formatDate(detail.endDate) }}</dd>
          </dl>
          <template v-if="evalStatus !== 'active'">
            <dl class="req-row full">
              <dt>강의 만족도</dt>
              <dd>
                <div class="star-wrap readonly">
                  <span v-for="n in 5" :key="n" class="star-container">
                    <span class="star-half left" :class="{ active: roundHalf(detail.score) >= n - 0.5 }">★</span>
                    <span class="star-half right" :class="{ active: roundHalf(detail.score) >= n }">★</span>
                  </span>
                  <span class="score-text">{{ roundHalf(detail.score).toFixed(1) }} / 5.0</span>
                </div>
              </dd>
            </dl>
            <dl class="req-row full">
              <dt>평가참여인원</dt>
              <dd>{{ detail.responseCount }} / {{ detail.totalStudents }}</dd>
            </dl>
          </template>
        </div>
        <p v-if="evalStatus === 'active'" class="empty-text">
          강의평가가 완료된 후 확인할 수 있습니다.
        </p>
        <template v-else>
          <table class="data-tbl" style="margin-top: 14px;">
            <thead>
              <tr><th>구분</th><th>조사 항목</th><th>평균</th></tr>
            </thead>
            <tbody>
              <tr v-for="(q, idx) in QUESTIONS" :key="idx">
                <td class="tac">{{ idx + 1 }}</td>
                <td>{{ q }}</td>
                <td>{{ detail[`q${idx + 1}Avg`]?.toFixed(1) ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 14px;">
            <p class="section-title">한줄평</p>
            <div v-for="(c, i) in detail.comments" :key="i" class="comment-box">{{ c }}</div>
            <p v-if="!detail.comments?.length" class="empty-text">작성된 수강평가가 없습니다.</p>
          </div>
        </template>
      </div>
    </template>

    <div class="page-footer">
      <button class="btn btn-default" @click="router.back()">
        <font-awesome-icon icon="fa-solid fa-chevron-left" /> 목록으로
      </button>
      <div class="action-group">
        <button
          v-if="role === 'STUDENT' && evalStatus === 'active' && detail?.hasGrade && detail?.score == null"
          class="btn btn-submit"
          @click="submitEval"
        >제출</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.star-wrap { display: flex; align-items: center; gap: 4px; }
.star-container { position: relative; display: inline-block; width: 28px; height: 28px; cursor: pointer; }
.star-half { position: absolute; top: 0; left: 0; overflow: hidden; white-space: nowrap; line-height: 1; font-size: 28px; color: $bold-border-color; }
.star-half.left { width: 50%; z-index: 2; }
.star-half.right { width: 100%; z-index: 1; }
.star-half.active { color: #f5a623; }
.star-wrap.readonly .star-container { cursor: default; }
.score-text { margin-left: 8px; font-size: 14px; }

.survey-guide { line-height: 1.6; padding: 12px; background: $default-bg; border-radius: 6px; margin: 14px 0; }
.choice-score { font-weight: normal; opacity: 0.5; }
.free-text-label { margin-bottom: 8px; text-align: left; }
.comment-box { padding: 10px 14px; background: $default-bg; border-radius: 6px; margin-bottom: 8px; }
</style> 
