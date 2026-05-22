<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import evaluationService from '@/services/evaluationService';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const modal = useModalStore();
const role = computed(() => authStore.role);

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
const selectedDetail = ref(null);

const maxPage = computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1);

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
    selectedDetail.value = null;
    return;
  }
  selectedItem.value = item;
  selectedDetail.value = null;
  try {
    let res;
    if (role.value === 'STUDENT') {
      res = await evaluationService.getStudentEvalDetail(item.lectureId);
    } else {
      res = await evaluationService.getProfessorEvalDetail(item.lectureId);
    }
    selectedDetail.value = res.data;
  } catch (e) {
    selectedDetail.value = null;
  }
};

const form = reactive({
  score: 0,
  comment: '',
});

const submitEval = async () => {
  if (!form.score) { await modal.showAlert('별점을 선택해주세요.', 'warning'); return; }
  if (form.comment.length < 10) { await modal.showAlert('수강평가를 10자 이상 작성해주세요.', 'warning'); return; }
  
  try {
    const lectureId = selectedItem.value.lectureId;
    await evaluationService.createEvaluation(lectureId, {
      lectureId,
      score: form.score,
      comment: form.comment,
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

const starText = (score) => {
  if (!score) return '';
  return '★'.repeat(score) + '☆'.repeat(5 - score);
};

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
  return { label: '완료', cls: 'done' };
};

const getProfessorBadge = (item) => {
  const status = getEvalStatus(item);
  if (status === 'before') return { label: '강의진행중', cls: 'before' };
  if (status === 'active') return { label: '진행중', cls: 'pending' };
  return { label: '평가완료', cls: 'done' };
};

const getBadge = (item) =>
  role.value === 'STUDENT' ? getStudentBadge(item) : getProfessorBadge(item);

onMounted(fetchList);
</script>

<template>
  <div class="container">
    <!-- 필터 -->
    <div class="filter-header">
      <div class="filter-group">
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
        <div class="filter-item">
          <div class="input-label">연도</div>
          <div class="input-content">
            <select v-model="filter.year" @change="onFilterChange">
              <option value="">전체</option>
              <option v-for="y in [2026, 2025, 2024]" :key="y" :value="y">{{ y }}년</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="eval-layout">
      <!-- 왼쪽: 카드 목록 -->
      <div class="eval-list">
        <p v-if="state.isLoading" class="empty-text">불러오는 중...</p>
        <p v-else-if="!state.list.length" class="empty-text">조회된 강의평가가 없습니다.</p>

        <div
          v-for="item in state.list"
          :key="item.lectureId"
          class="eval-card"
          :class="{ active: selectedItem?.lectureId === item.lectureId }"
          @click="selectItem(item)"
        >
          <div class="card-left">
            <span class="lecture-name">{{ item.lectureName }}</span>
            <span class="pro-name" v-if="role === 'STUDENT'">{{ item.proName }}</span>
          </div>
          <div class="card-right">
            <span :class="['badge', getBadge(item).cls]">{{ getBadge(item).label }}</span>
          </div>
        </div>

        <div class="pagination" v-if="maxPage > 1">
          <button
            v-for="p in maxPage"
            :key="p"
            :class="{ active: state.currentPage === p }"
            @click="state.currentPage = p; fetchList()"
          >{{ p }}</button>
        </div>
      </div>

      <!-- 학생 패널 -->
      <div class="eval-detail" v-if="role === 'STUDENT' && selectedItem && selectedDetail != null">
        <!-- active + 성적 미입력 -->
        <template v-if="getEvalStatus(selectedItem) === 'active' && !selectedItem.hasGrade">
          <p class="empty-text">교수님이 성적을 입력한 후 강의평가가 가능합니다.</p>
        </template>
        <!-- active + 성적 있음 + 미작성: 바로 작성 폼 -->
        <template v-else-if="getEvalStatus(selectedItem) === 'active' && selectedItem.hasGrade && selectedDetail.score == null">
          <div class="detail-row"><span class="label">강의명</span><span>{{ selectedItem.lectureName }}</span></div>
          <div class="detail-row"><span class="label">교수명</span><span>{{ selectedItem.proName }}</span></div>
          <div class="form-row">
            <span class="label">강의 만족도</span>
            <div class="star-wrap">
              <span v-for="n in 5" :key="n" class="star" :class="{ active: n <= form.score }" @click="form.score = n">★</span>
              <span class="score-text">{{ form.score }}.0 / 5.0</span>
            </div>
          </div>
          <div class="form-row column">
            <span class="label">수강평가</span>
            <textarea v-model="form.comment" class="textarea" placeholder="10자 이상 작성해주세요." rows="5"/>
            <span class="char-count">{{ form.comment.length }}자</span>
          </div>
          <div class="btn-wrap">
            <button class="btn-primary" @click="submitEval">제출</button>
          </div>
        </template>
        <!-- active + 성적 있음 + 완료: 본인 평가 조회 -->
        <template v-else-if="getEvalStatus(selectedItem) === 'active' && selectedItem.hasGrade && selectedDetail.score != null">
          <div class="detail-row"><span class="label">강의 만족도</span><span>{{ starText(selectedDetail.score) }} {{ selectedDetail.score }}.0 / 5.0</span></div>
          <div class="detail-row"><span class="label">수강평가</span></div>
          <div class="comment-box">{{ selectedDetail.comment }}</div>
        </template>
        <!-- before: 한 줄 메시지 -->
        <template v-else-if="getEvalStatus(selectedItem) === 'before'">
          <p class="empty-text">진행중인 강의입니다.</p>
        </template>
        <!-- done: 한 줄 메시지 -->
        <template v-else>
          <p class="empty-text">강의평가 기간이 아닙니다.</p>
        </template>
      </div>

      <!-- 교수: 상세 -->
      <div class="eval-detail" v-else-if="role !== 'STUDENT' && selectedItem && selectedDetail">
        <div class="detail-row"><span class="label">강의명</span><span>{{ selectedDetail.lectureName }}</span></div>
        <div class="detail-row"><span class="label">교수명</span><span>{{ selectedDetail.proName }}</span></div>
        <div class="detail-row"><span class="label">평가기간</span><span>{{ formatDate(selectedDetail.startDate) }} ~ {{ formatDate(selectedDetail.endDate) }}</span></div>
        <!-- active: 결과 숨김 -->
        <template v-if="getEvalStatus(selectedItem) === 'active'">
          <p class="empty-text">강의평가가 완료된 후 확인할 수 있습니다.</p>
        </template>
        <!-- done: 결과 공개 -->
        <template v-else>
          <div class="detail-row"><span class="label">강의 만족도</span><span>{{ selectedDetail.score?.toFixed(1) ?? '-' }} / 5.0</span></div>
          <div class="detail-row"><span class="label">평가참여인원</span><span>{{ selectedDetail.responseCount }} / {{ selectedDetail.totalStudents }}</span></div>
          <div class="detail-row"><span class="label">수강평가</span></div>
          <div v-for="(c, i) in selectedDetail.comments" :key="i" class="comment-box">{{ c }}</div>
          <p v-if="!selectedDetail.comments?.length" class="empty-text">작성된 수강평가가 없습니다.</p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.eval-layout { display: flex; gap: 20px; align-items: flex-start; }
.eval-list { flex: 0 0 460px; display: flex; flex-direction: column; gap: 8px; }
.eval-detail {
  flex: 1; border: 1px solid #ddd; border-radius: 8px;
  padding: 20px; display: flex; flex-direction: column;
  gap: 12px; background: #fff;
}
.eval-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border: 1px solid #ddd; border-radius: 6px;
  cursor: pointer; background: #fff;
}
.eval-card:hover, .eval-card.active { background: var(--hover-bg-color, #f5f5f5); }
.card-left { display: flex; flex-direction: column; gap: 4px; }
.lecture-name { font-weight: 600; font-size: 15px; }
.pro-name { font-size: 13px; color: #777; }
.badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.badge.before { background: #fff3e0; color: #ef6c00; }
.badge.pending { background: #e8f4f0; color: var(--main-color, #3e9e7e); }
.badge.done { background: #f0f0f0; color: #888; }
.star-score { color: #f5a623; font-size: 13px; }
.detail-row { display: flex; gap: 12px; align-items: center; font-size: 14px; }
.label { min-width: 90px; font-weight: 600; color: #555; }
.comment-box { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; font-size: 14px; color: #333; }
.sub-list { margin-top: 16px; border-top: 1px dashed #ddd; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.sub-list-title { font-size: 12px; color: #999; margin-bottom: 4px; }
.empty-detail { justify-content: center; align-items: center; min-height: 200px; }
.empty-text { color: #999; font-size: 14px; text-align: center; }
.btn-primary { padding: 8px 20px; background: var(--main-color, #3e9e7e); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.pagination { display: flex; justify-content: center; gap: 4px; margin-top: 12px; }
.pagination button { padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #fff; }
.pagination button.active { background: var(--main-color, #3e9e7e); color: #fff; border-color: var(--main-color, #3e9e7e); }
.filter-header { margin-bottom: 16px; }
.filter-group { display: flex; gap: 12px; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.input-label { font-size: 13px; color: #555; }
.form-row { display: flex; align-items: center; gap: 12px; }
.form-row.column { flex-direction: column; align-items: flex-start; }
.star-wrap { display: flex; align-items: center; gap: 4px; }
.star { font-size: 28px; cursor: pointer; color: #ddd; }
.star.active { color: #f5a623; }
.score-text { margin-left: 8px; font-size: 14px; color: #555; }
.textarea { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; resize: vertical; outline: none; }
.char-count { font-size: 12px; color: #999; align-self: flex-end; }
.btn-wrap { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { padding: 8px 20px; background: #fff; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; font-size: 14px; }
</style>