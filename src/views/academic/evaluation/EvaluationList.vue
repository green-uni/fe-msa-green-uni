<script setup>
import { reactive, onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import evaluationService from '@/services/evaluationService';

const router = useRouter();
const authStore = useAuthStore();
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
  year: getCurrentTerm().year,
  semester: getCurrentTerm().semester,
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

const moveToWrite = (lectureId) => {
  router.push(`evaluations/${lectureId}/edit`);
};

const starText = (score) => {
  if (!score) return '';
  return '★'.repeat(score) + '☆'.repeat(5 - score);
};

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
            <template v-if="role === 'STUDENT'">
              <span
                v-if="selectedDetail?.score && selectedItem?.lectureId === item.lectureId"
                class="star-score"
              >
                {{ starText(selectedDetail.score) }} {{ selectedDetail.score }}.0 / 5.0
              </span>
              <span v-else class="badge pending">진행중</span>
            </template>
            <template v-else>
              <span class="badge pending">진행중</span>
            </template>
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

      <!-- 오른쪽: 상세 (선택 + 데이터 있을 때) -->
      <div class="eval-detail" v-if="selectedItem && selectedDetail">

        <!-- 학생 상세 -->
        <template v-if="role === 'STUDENT'">
          <div class="detail-row"><span class="label">강의명</span><span>{{ selectedDetail.lectureName }}</span></div>
          <div class="detail-row"><span class="label">교수명</span><span>{{ selectedDetail.proName }}</span></div>
          <div class="detail-row"><span class="label">평가기간</span><b>{{ selectedDetail.startDate }}~{{ selectedDetail.endDate }}</b></div>
          <div class="detail-row"><span class="label">강의 만족도</span><span>{{ selectedDetail.score }}.0 / 5.0</span></div>
          <div class="detail-row"><span class="label">수강평가</span></div>
          <div class="comment-box">{{ selectedDetail.comment }}</div>
        </template>

        <!-- 교수 상세 -->
        <template v-else>
          <div class="detail-row"><span class="label">강의명</span><span>{{ selectedDetail.lectureName }}</span></div>
          <div class="detail-row"><span class="label">교수명</span><span>{{ selectedDetail.proName }}</span></div>
          <div class="detail-row"><span class="label">평가기간</span><b>{{ selectedDetail.startDate }}~{{ selectedDetail.endDate }}</b></div>
          <div class="detail-row"><span class="label">강의 만족도</span><span>{{ selectedDetail.score?.toFixed(1) ?? '-' }} / 5.0</span></div>
          <div class="detail-row"><span class="label">평가참여인원</span><span>{{ selectedDetail.responseCount }} / {{ selectedDetail.totalStudents }}</span></div>
          <div class="detail-row"><span class="label">수강평가</span></div>
          <div v-for="(c, i) in selectedDetail.comments" :key="i" class="comment-box">{{ c }}</div>
          <p v-if="!selectedDetail.comments?.length" class="empty-text">작성된 수강평가가 없습니다.</p>
        </template>

        <!-- 아래 나머지 카드 목록 -->
        <div class="sub-list">
          <p class="sub-list-title">※ 아래 카드형식으로 목록을 나타내고 클릭시 위와같이 펼쳐서 보여짐</p>
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
              <span class="badge pending">진행중</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 선택했는데 상세 없는 경우 (미완료 학생) -->
      <div class="eval-detail empty-detail" v-else-if="selectedItem && !selectedDetail">
        <p class="empty-text">아직 작성된 평가가 없습니다.</p>
        <button v-if="role === 'STUDENT'" class="btn-primary" @click="moveToWrite(selectedItem.lectureId)">
          평가 작성하기
        </button>
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
.badge.pending { background: #e8f4f0; color: var(--main-color, #3e9e7e); }
.star-score { color: #f5a623; font-size: 13px; }
.detail-row { display: flex; gap: 12px; align-items: center; font-size: 14px; }
.label { min-width: 90px; font-weight: 600; color: #555; }
.comment-box { padding: 10px 14px; background: #f9f9f9; border-radius: 6px; font-size: 14px; color: #333; }
.sub-list { margin-top: 16px; border-top: 1px dashed #ddd; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.sub-list-title { font-size: 12px; color: #999; margin-bottom: 4px; }
.empty-detail { justify-content: center; align-items: center; min-height: 200px; }
.empty-text { color: #999; font-size: 14px; text-align: center; }
.btn-primary { padding: 8px 20px; background: var(--main-color, #3e9e7e); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 12px; }
.pagination { display: flex; justify-content: center; gap: 4px; margin-top: 12px; }
.pagination button { padding: 4px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; background: #fff; }
.pagination button.active { background: var(--main-color, #3e9e7e); color: #fff; border-color: var(--main-color, #3e9e7e); }
.filter-header { margin-bottom: 16px; }
.filter-group { display: flex; gap: 12px; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.input-label { font-size: 13px; color: #555; }
</style>