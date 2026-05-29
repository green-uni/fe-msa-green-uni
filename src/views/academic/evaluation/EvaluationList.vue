<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import evaluationService from '@/services/evaluationService';
import CardListDetail from '@/components/common/CardListDetail.vue';
import Pagination from '@/components/common/Pagination.vue';

const yearOptions = ref([]);
const route = useRoute();
const authStore = useAuthStore();
const modal = useModalStore();
const role = computed(() => authStore.role);

const hoverScore = ref(0);
const onStarHover = (n, e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const isLeft = e.clientX < rect.left + rect.width / 2;
  hoverScore.value = isLeft ? n - 0.5 : n;
};
const onStarClick = (n, e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const isLeft = e.clientX < rect.left + rect.width / 2;
  scoreForm.score = isLeft ? n - 0.5 : n;
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
  q1: null, q2: null, q3: null, q4: null, q5: null,
  comment: '',
});

const scoreForm = reactive({
  score: 0,
});

const PAGE_SIZE = 10;

const getCurrentTerm = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    semester: now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8 ? 1 : 2,
  };
};

const filter = reactive({
  year: route.query.year ? Number(route.query.year) : getCurrentTerm().year,
  semester: route.query.semester ? Number(route.query.semester) : getCurrentTerm().semester,
});

const state = reactive({
  list: [],
  currentPage: 1,
  totalCount: 0,
  isLoading: false,
});

const selectedItem = ref(null);
const selectedDetail = ref({ score: 0 })

const maxPage = computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1);

const fetchYearOptions = async () => {
  const curYear = getCurrentTerm().year;
  try {
    let res;
    if (role.value === 'STUDENT') {
      res = await evaluationService.getStudentEvalYears();
    } else {
      res = await evaluationService.getProfessorEvalYears();
    }
    const years = res.data ?? [];
    if (!years.includes(curYear)) years.unshift(curYear);
    yearOptions.value = years;
  } catch (err) {
    console.error('연도 옵션 로드 실패:', err);
    yearOptions.value = [curYear];
  }
};

onMounted(() => {
  fetchYearOptions();
  fetchList();
});

const fetchList = async () => {
  state.isLoading = true;
  selectedItem.value = null;
  selectedDetail.value = null;
  try {
    const params = {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      page: state.currentPage,
      size: PAGE_SIZE,
      startIdx: (state.currentPage - 1) * PAGE_SIZE,
    };
    let res;
    if (role.value === 'STUDENT') {
      res = await evaluationService.getStudentEvalList(params);
    } else {
      res = await evaluationService.getProfessorEvalList(params);
    }
    state.list = res.data ?? [];
    state.totalCount = state.list.length;
  } catch (e) {
    console.error(e);
    state.list = [];
  } finally {
    state.isLoading = false;
  }
};

const onFilterChange = () => {
  state.currentPage = 1;
  fetchList();
};

const selectItem = async (item) => {
  if (selectedItem.value?.lectureId === item.lectureId) {
    selectedItem.value = null;
    selectedDetail.value = { score: 0 };
    return;
  }
  selectedItem.value = item;
  selectedDetail.value = { score: 0 };
  try {
    let res;
    if (role.value === 'STUDENT') {
      res = await evaluationService.getStudentEvalDetail(item.lectureId);
    } else {
      res = await evaluationService.getProfessorEvalDetail(item.lectureId);
    }
    selectedDetail.value = res.data ?? { score: 0 };
  } catch (e) {
    selectedDetail.value = { score: 0 };
  }
};

const submitEval = async () => {
  if (!scoreForm.score) { await modal.showAlert('전체 강의 만족도를 선택해주세요.', 'warning'); return; }
  if (!evalForm.q1 || !evalForm.q2 || !evalForm.q3 || !evalForm.q4 || !evalForm.q5) {
    await modal.showAlert('모든 문항에 응답해주세요.', 'warning'); return;
  }
  if (evalForm.comment.length < 10) { await modal.showAlert('수강평가를 10자 이상 작성해주세요.', 'warning'); return; }

  try {
    const lectureId = selectedItem.value.lectureId;
    await evaluationService.createEvaluation(lectureId, {
      lectureId,
      score: scoreForm.score,
      q1: evalForm.q1, q2: evalForm.q2, q3: evalForm.q3, q4: evalForm.q4, q5: evalForm.q5,
      comment: evalForm.comment,
    });
    await modal.showAlert('강의평가가 등록되었습니다.', 'success');
    await fetchList();
    const item = state.list.find(i => i.lectureId === lectureId);
    if (item) await selectItem(item);
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (dt) => dt ? dt.slice(0, 10) : '-';

const getEvalStatus = (item) => {
  const today = new Date();
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;
  if (!start || !end || today < start) return 'before';
  if (today > end) return 'done';
  return 'active';
};

const getStudentBadge = (item) => {
  const status = getEvalStatus(item);
  if (status === 'before') return { label: '강의진행중', cls: 'before' };
  if (status === 'active') return item.isEvaluated
    ? { label: '완료', cls: 'done' }
    : { label: '미작성', cls: 'pending' };
  return item.isEvaluated
    ? { label: '완료', cls: 'done' }
    : { label: '평가기간만료', cls: 'expired' };
};

const getProfessorBadge = (item) => {
  const status = getEvalStatus(item);
  if (status === 'before') return { label: '강의진행중', cls: 'before' };
  if (status === 'active') return { label: '진행중', cls: 'pending' };
  return { label: '평가완료', cls: 'done' };
};

const getBadge = (item) =>
  role.value === 'STUDENT' ? getStudentBadge(item) : getProfessorBadge(item);

const goToPage = (page) => {
  state.currentPage = page;
  fetchList();
};

</script>

<template>
  <div class="container">
    <div class="filter-header">
      <div class="filter-group">
        <div class="filter-item">
          <div class="input-label">연도</div>
          <div class="input-content">
            <select v-model="filter.year" @change="onFilterChange">
              <option value="">전체</option>
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
            </select>
          </div>
        </div>
                <div class="filter-item">
          <div class="input-label">학기</div>
          <div class="input-content">
            <select v-model="filter.semester" @change="onFilterChange">
              <option value="">전체</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <CardListDetail
      :items="state.list"
      :is-loading="state.isLoading"
      item-key="lectureId"
      :selected-key="selectedItem?.lectureId"
      empty-message="조회된 강의평가가 없습니다."
      @select="selectItem"
    >
      <template #card="{ item }">
        <div class="card-left">
          <span class="lecture-name">{{ item.lectureName }}</span>
          <span class="pro-name" v-if="role === 'STUDENT'">{{ item.proName }}</span>
        </div>
        <span :class="['badge', getBadge(item).cls]">{{ getBadge(item).label }}</span>
      </template>

      <template #detail>
        <template v-if="role === 'STUDENT' && selectedItem">
          <template v-if="getEvalStatus(selectedItem) === 'active' && !selectedItem.hasGrade">
            <p class="empty-text">교수님이 성적을 입력한 후 강의평가가 가능합니다.</p>
          </template>

          <template v-else-if="getEvalStatus(selectedItem) === 'active' && selectedItem.hasGrade && selectedDetail?.score == null">
            <div class="detail-row"><span class="label">강의명</span><span>{{ selectedItem.lectureName }}</span></div>
            <div class="detail-row"><span class="label">교수명</span><span>{{ selectedItem.proName }}</span></div>
            <div class="form-row">
              <span class="label">강의 만족도</span>
              <div class="star-wrap">
                <span v-for="n in 5" :key="n" class="star-container"
                  @mousemove="onStarHover(n, $event)" @mouseleave="hoverScore = 0" @click="onStarClick(n, $event)">
                  <span class="star-half left" :class="{ active: (hoverScore || scoreForm.score) >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: (hoverScore || scoreForm.score) >= n }">★</span>
                </span>
                <span class="score-text">{{ scoreForm.score }} / 5.0</span>
              </div>
            </div>
            <div class="survey-guide">
              본 설문은 수업 개선의 기초 및 교육의 질적인 향상을 위해 실시합니다.
              성실하게 작성하여 주시기 바랍니다.
            </div>
            <table class="survey-table">
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
                  <td>{{ idx + 1 }}</td>
                  <td class="q-text">{{ q }}</td>
                  <td v-for="c in CHOICES" :key="c.label">
                    <input type="radio" :name="`q${idx + 1}`" :value="c.value" v-model="evalForm[`q${idx + 1}`]"/>
                  </td>
                </tr>
                <tr>
                  <td>6</td>
                  <td colspan="6">
                    <div class="free-text-label">그 외 하고 싶은 말을 적어주세요.</div>
                    <textarea v-model="evalForm.comment" class="textarea" placeholder="10자 이상 작성해주세요." rows="4"/>
                    <span class="char-count">{{ evalForm.comment.length }}자</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="btn-wrap">
              <button class="btn-primary" @click="submitEval">제출</button>
            </div>
          </template>

          <template v-else-if="getEvalStatus(selectedItem) === 'active' && selectedItem.hasGrade && selectedDetail?.score != null">
            <div class="detail-row">
              <span class="label">강의 만족도</span>
              <div class="star-wrap readonly">
                <span v-for="n in 5" :key="n" class="star-container">
                  <span class="star-half left" :class="{ active: selectedDetail.score >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: selectedDetail.score >= n }">★</span>
                </span>
                <span class="score-text">{{ selectedDetail.score }} / 5.0</span>
              </div>
            </div>
            <table class="survey-table">
              <thead>
                <tr><th>구분</th><th>조사 항목</th><th>응답</th></tr>
              </thead>
              <tbody>
                <tr v-for="(q, idx) in QUESTIONS" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td class="q-text">{{ q }}</td>
                  <td>{{ selectedDetail[`q${idx + 1}`] ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="detail-row"><span class="label">강의평가</span></div>
            <div class="comment-box">{{ selectedDetail.comment }}</div>
          </template>

          <template v-else-if="getEvalStatus(selectedItem) === 'before'">
            <p class="empty-text">진행중인 강의입니다.</p>
          </template>

          <template v-else-if="getEvalStatus(selectedItem) === 'done' && selectedItem.isEvaluated">
            <div class="detail-row">
              <span class="label">강의 만족도</span>
              <div class="star-wrap readonly">
                <span v-for="n in 5" :key="n" class="star-container">
                  <span class="star-half left" :class="{ active: selectedDetail?.score >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: selectedDetail?.score >= n }">★</span>
                </span>
                <span class="score-text">{{ selectedDetail.score }} / 5.0</span>
              </div>
            </div>
            <table class="survey-table">
              <thead>
                <tr><th>구분</th><th>조사 항목</th><th>응답</th></tr>
              </thead>
              <tbody>
                <tr v-for="(q, idx) in QUESTIONS" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td class="q-text">{{ q }}</td>
                  <td>{{ selectedDetail[`q${idx + 1}`] ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="detail-row"><span class="label">강의평가</span></div>
            <div class="comment-box">{{ selectedDetail.comment }}</div>
          </template>

          <template v-else-if="getEvalStatus(selectedItem) === 'done' && !selectedItem.isEvaluated">
            <p class="empty-text">작성되지 않은 강의입니다.</p>
          </template>
        </template>

        <template v-else-if="role !== 'STUDENT' && selectedItem && selectedDetail">
          <div class="detail-row"><span class="label">강의명</span><span>{{ selectedDetail.lectureName }}</span></div>
          <div class="detail-row"><span class="label">교수명</span><span>{{ selectedDetail.proName }}</span></div>
          <div class="detail-row"><span class="label">평가기간</span><span>{{ formatDate(selectedDetail.startDate) }} ~ {{ formatDate(selectedDetail.endDate) }}</span></div>
          <template v-if="getEvalStatus(selectedItem) === 'active'">
            <p class="empty-text">강의평가가 완료된 후 확인할 수 있습니다.</p>
          </template>
          <template v-else>
            <div class="detail-row">
              <span class="label">강의 만족도</span>
              <div class="star-wrap readonly">
                <span v-for="n in 5" :key="n" class="star-container">
                  <span class="star-half left" :class="{ active: selectedDetail.score >= n - 0.5 }">★</span>
                  <span class="star-half right" :class="{ active: selectedDetail.score >= n }">★</span>
                </span>
                <span class="score-text">{{ selectedDetail.score?.toFixed(1) ?? '-' }} / 5.0</span>
              </div>
            </div>
            <div class="detail-row"><span class="label">평가참여인원</span><span>{{ selectedDetail.responseCount }} / {{ selectedDetail.totalStudents }}</span></div>
            <table class="survey-table">
              <thead>
                <tr><th>구분</th><th>조사 항목</th><th>평균</th></tr>
              </thead>
              <tbody>
                <tr v-for="(q, idx) in QUESTIONS" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td class="q-text">{{ q }}</td>
                  <td>{{ selectedDetail[`q${idx + 1}Avg`]?.toFixed(1) ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="detail-row"><span class="label">수강평가</span></div>
            <div v-for="(c, i) in selectedDetail.comments" :key="i" class="comment-box">{{ c }}</div>
            <p v-if="!selectedDetail.comments?.length" class="empty-text">작성된 수강평가가 없습니다.</p>
          </template>
        </template>
      </template>
      <template #detail-empty>
        <h3 class="notice-title">나의 강의평가</h3>
        <p class="notice-desc">
          좌측 목록에서 강의를 선택하면 상세 내용을 확인할 수 있습니다.
        </p>
        <table class="notice-table">
          <colgroup>
            <col style="width: 100px"/>
            <col/>
          </colgroup>
          <tbody>
            <template v-if="role === 'STUDENT'">
              <tr><th><span class="badge before">강의진행중</span></th><td>강의평가 기간이 시작되지 않은 강의입니다.</td></tr>
              <tr><th><span class="badge pending">미작성</span></th><td>강의평가 기간이며 아직 평가를 작성하지 않은 강의입니다.</td></tr>
              <tr><th><span class="badge done">완료</span></th><td>강의평가를 완료한 강의입니다.</td></tr>
              <tr><th><span class="badge expired">평가기간만료</span></th><td>평가 기간이 종료되어 더 이상 작성할 수 없습니다.</td></tr>
            </template>
            <template v-else>
              <tr><th><span class="badge before">강의진행중</span></th><td>강의평가 기간이 시작되지 않은 강의입니다.</td></tr>
              <tr><th><span class="badge pending">진행중</span></th><td>현재 강의평가 기간입니다. 결과는 기간 종료 후 확인 가능합니다.</td></tr>
              <tr><th><span class="badge done">평가완료</span></th><td>강의평가 기간이 종료되어 결과를 확인할 수 있습니다.</td></tr>
            </template>
          </tbody>
        </table>
      </template>
      </CardListDetail>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goToPage"
    />
  </div>
</template>

<style scoped>
.card-left { display: flex; flex-direction: column; gap: 4px; }
.lecture-name { font-weight: 600; font-size: 15px; }
.pro-name { font-size: 13px; color: #777; }
.badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge.before { color: #888; }
.badge.pending { color: #c62828; }
.badge.done { color: #333; }
.badge.expired { color: #888; }
.detail-row { display: flex; gap: 12px; align-items: center; font-size: 14px; }
.label { min-width: 90px; font-weight: 600; color: #555; }
.comment-box { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; font-size: 14px; color: #333; }
.empty-text { color: #999; font-size: 14px; text-align: center; }
.btn-primary { padding: 8px 20px; background: var(--main-color, #3e9e7e); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.filter-header { margin-bottom: 16px; }
.filter-group { display: flex; gap: 12px; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.input-label { font-size: 13px; color: #555; }
.form-row { display: flex; align-items: center; gap: 12px; }
.form-row.column { flex-direction: column; align-items: flex-start; }
.star-wrap { display: flex; align-items: center; gap: 4px; }
.star-container { position: relative; display: inline-block; width: 28px; height: 28px; cursor: pointer; }
.star-half { position: absolute; top: 0; left: 0; overflow: hidden; white-space: nowrap; line-height: 1; font-size: 28px; color: #ddd; }
.star-half.left { width: 50%; z-index: 2; }
.star-half.right { width: 100%; z-index: 1; }
.star-half.active { color: #f5a623; }
.star-wrap.readonly .star-container { cursor: default; }
.score-text { margin-left: 8px; font-size: 14px; color: #555; }
.textarea { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; resize: vertical; outline: none; }
.char-count { font-size: 12px; color: #999; align-self: flex-end; }
.btn-wrap { display: flex; justify-content: flex-end; gap: 8px; }
.survey-guide { font-size: 13px; color: #555; line-height: 1.6; padding: 12px; background: #f9f9f9; border-radius: 6px; }
.survey-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.survey-table th, .survey-table td { border: 1px solid #ddd; padding: 10px; text-align: center; }
.survey-table th { background: var(--main-color, #3e9e7e); color: #fff; }
.survey-table td.q-text { text-align: left; }
.free-text-label { font-size: 13px; color: #555; margin-bottom: 8px; text-align: left; }
.choice-score { font-size: 11px; font-weight: normal; opacity: 0.8; }
.notice-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.notice-desc { font-size: 14px; color: #777; margin-bottom: 16px; line-height: 1.6; }
.notice-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.notice-table th, .notice-table td { padding: 10px 12px; border: 1px solid #eee; vertical-align: middle; }
.notice-table th { background: #f9f9f9; text-align: center; color: #333; }
.notice-table .badge { color: #333; background: none; padding: 0; font-size: 13px; }
</style>