<script setup>
import { useAuthStore } from '@/stores/authentication';
import LectureService from '@/services/lectureService';
import { reactive, onMounted, computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DataTable from '@/components/common/DataTable.vue';
import Pagination from '@/components/common/Pagination.vue';
import SearchInput from '@/components/util/SearchInput.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// ── 검색어 ──────────────────────────────────────
const searchQuery = ref('');
const searchInput = ref('');

// ── 현재 학기 ────────────────────────────────────
const getCurrentTerm = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    semester: (now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 8) ? 1 : 2,
  };
};

// ── 역할 판단 ────────────────────────────────────
const isProfessor = computed(() => authStore.role === 'PROFESSOR');
const isStudent = computed(() => authStore.role === 'STUDENT');

// ── 탭 (교수만) ───────────────────────────────────
const TABS = ['전체', '대기', '승인', '반려'];
const STATUS_MAP = { '대기': 'PENDING', '승인': 'APPROVED', '반려': 'REJECTED' };
const LABEL_MAP = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' };
const activeTab = ref('전체');

const onTabClick = (tab) => {
  activeTab.value = tab;
  filter.status = STATUS_MAP[tab] || '';
  state.currentPage = 1;
  pushQuery();
};

// ── 상태 ────────────────────────────────────────
const PAGE_SIZE = 10;

const state = reactive({
  list: [],
  totalCount: 0,
  isLoading: false,
  currentPage: 1,
});

const filter = reactive({
  year: '',
  semester: '',
  status: '',   // 교수만 사용
});

const semesterOptions = [1, 2];
const yearOptions = ref([]);

// ── lectureType 한글 변환 ──────────────────────────
const LECTURE_TYPE_LABEL = {
  GENERAL_REQUIRED: '교양필수',
  GENERAL_ELECTIVE: '교양선택',
  MAJOR_REQUIRED: '전공필수',
  MAJOR_ELECTIVE: '전공선택',
};
const lectureTypeLabel = (code) => LECTURE_TYPE_LABEL[code] || code;

// ── schedule 헬퍼 ─────────────────────────────────
const scheduleText = (schedules) => {
  if (!schedules?.length) return '-';
  return schedules.map(s => `${s.dayOfWeek} ${s.startPeriod}~${s.endPeriod}교시`).join(',\n');
};
const roomText = (schedules) => {
  if (!schedules?.length) return '-';
  const rooms = [...new Set(schedules.map(s => `${s.building ?? ''} ${s.room ?? ''}`.trim()))];
  return rooms.join(',\n');
};

// ── 테이블 컬럼 설정 ──────────────────────────────
const tableConfig = computed(() => {
  if (isProfessor.value) {
    return {
      cols: ['이수구분', '강의명', '전공명', '강의시간', '강의실', '학점', '대상학년', '승인상태'],
      grid: '90px 3fr 130px 180px 130px 60px 70px 80px',
    };
  }
  // 학생
  return {
    cols: ['이수구분', '강의명', '교수명', '강의시간', '강의실', '학점'],
    grid: '90px 4fr 100px 200px 150px 60px',
  };
});

// ── 최대 페이지 ───────────────────────────────────
const maxPage = computed(() => Math.ceil(state.totalCount / PAGE_SIZE) || 1);

// ── API 호출 ─────────────────────────────────────
const fetchList = async () => {
  state.isLoading = true;
  try {
    const params = {
      year: filter.year || undefined,
      semester: filter.semester || undefined,
      lectureName: searchInput.value || undefined,
      page: state.currentPage,
      size: PAGE_SIZE,
      startIdx: (state.currentPage - 1) * PAGE_SIZE, 
    };
    if (isProfessor.value && filter.status) {
      params.status = filter.status;
    }
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    let data;
    if (isProfessor.value) {
      const res = await LectureService.getProfessorMyLectures(params);
      data = res.data || [];
    } else {
      const res = await LectureService.getStudentMyLectures(params);
      data = res.data || [];
    }

    state.list = data;
    state.totalCount = data[0]?.totalCount ?? 0;

    // 연도 옵션 갱신
    const years = [...new Set(data.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
    if (years.length) {
      const curYear = getCurrentTerm().year;
      if (!years.includes(curYear)) years.unshift(curYear);
      yearOptions.value = years;
    }

  } catch (err) {
    console.error('내 강의 목록 로드 실패:', err);
    state.list = [];
    state.totalCount = 0;
  } finally {
    state.isLoading = false;
  }
};

// ── URL ↔ 필터 동기화 ──────────────────────────────
const syncFromQuery = (query) => {
  const { year: curYear, semester: curSemester } = getCurrentTerm();
  filter.year = query.year ? Number(query.year) : curYear;
  filter.semester = query.semester !== undefined
    ? (query.semester ? Number(query.semester) : '')
    : curSemester;
  filter.status = query.status || '';
  searchInput.value = query.search || '';
  searchQuery.value = query.search || '';
  state.currentPage = query.page ? Number(query.page) : 1;

  // 탭 동기화
  const tabLabel = LABEL_MAP[query.status] || '전체';
  activeTab.value = tabLabel === '전체' ? '전체' : tabLabel;
};

const pushQuery = () => {
  router.push({
    path: route.path,
    query: {
      year: filter.year || undefined,
      semester: filter.semester !== '' ? filter.semester : undefined,
      status: filter.status || undefined,
      search: searchInput.value || undefined,
      page: state.currentPage,
    },
  });
};

// ── 검색 ─────────────────────────────────────────
const onSearch = () => {
  searchInput.value = searchQuery.value;
  state.currentPage = 1;
  pushQuery();
};

// ── 필터 변경 ─────────────────────────────────────
const onFilterChange = () => {
  state.currentPage = 1;
  pushQuery();
};

// ── 페이지 이동 ───────────────────────────────────
const goToPage = (page) => {
  state.currentPage = page;
  router.push({ path: route.path, query: { ...route.query, page } });
};

// ── 상세 이동 ─────────────────────────────────────
const moveToDetail = (id) => {
  router.push({
    path: `/lectures/my/${id}`,
    query: {
      from: 'my',
      year: filter.year,
      semester: filter.semester,
      status: filter.status,
      search: searchInput.value,
      page: state.currentPage,
    },
  });
};

// ── watch ─────────────────────────────────────────
watch(
  () => route.query,
  (newQuery, oldQuery) => {
    if (oldQuery) {
      const oWp = { ...oldQuery }; delete oWp.page;
      const nWp = { ...newQuery }; delete nWp.page;
      if (JSON.stringify(oWp) === JSON.stringify(nWp)) {
        state.currentPage = Number(newQuery.page) || 1;
        fetchList();
        return;
      }
    }
    syncFromQuery(newQuery);
    fetchList();
  },
  { immediate: true, deep: true }
);

// 연도 옵션만 가져오는 함수
const fetchYearOptions = async () => {
  try {
    const res = await LectureService.getProfessorMyLectures({ 
      page: 1, 
      size: 100,
      startIdx: 0
    });
    const data = res.data || [];
    const years = [...new Set(data.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
    yearOptions.value = years;
  } catch (err) {
    console.error('연도 옵션 로드 실패:', err);
  }
};

// 초기 진입: query 없으면 기본값 세팅
onMounted(() => {
  fetchYearOptions();
  if (Object.keys(route.query).length === 0) {
    const { year, semester } = getCurrentTerm();
    router.replace({ path: route.path, query: { year, semester, page: 1 } });
  }
});
</script>

<template>
  <div class="container">

    <div class="filter-header">
      <!-- 탭: 교수만 노출 -->
      <div class="tab-area" v-if="isProfessor">
        <button
          v-for="tab in TABS"
          :key="tab"
          :class="['filter-btn', { active: activeTab === tab }]"
          @click="onTabClick(tab)"
        >
          {{ tab }}
        </button>
      </div>

      <div class="d-flex g10" :class="{ full: !isProfessor }">
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
                <option v-for="s in semesterOptions" :key="s" :value="s">{{ s }}학기</option>
              </select>
            </div>
          </div>
        </div>

        <div class="search-area input-content">
          <SearchInput
            v-model="searchQuery"
            :list="state.list"
            labelKey="lectureName"
            :realtime="false"
            placeholder="강의명을 입력하세요"
            @select="(item) => { searchInput.value = item.lectureName; searchQuery.value = item.lectureName; state.currentPage = 1; }"
            @enter="onSearch"
          />
          <button class="btn search-btn" @click="onSearch">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
          </button>
        </div>
      </div>
    </div>

    <div class="data-header">
      전체: {{ state.totalCount }}건
    </div>

    <DataTable
      :columns="tableConfig.cols"
      :rows="state.list"
      :gridCols="tableConfig.grid"
      :isLoading="state.isLoading"
      emptyMessage="조회된 강의가 없습니다."
    >
      <article
        class="tbl-row"
        :style="`display:grid; grid-template-columns:${tableConfig.grid}; align-items:center; text-align:center;`"
        v-for="item in state.list"
        :key="item.lectureId"
        @click="moveToDetail(item.lectureId)"
      >
        <div>{{ lectureTypeLabel(item.lectureType) }}</div>
        <div>{{ item.lectureName }}</div>
        <!-- 교수: 전공명 / 학생: 교수명 -->
        <div v-if="isProfessor">{{ item.majorName }}</div>
        <div v-else>{{ item.proName }}</div>
        <div style="white-space: pre-line;">{{ scheduleText(item.schedules) }}</div>
        <div style="white-space: pre-line;">{{ roomText(item.schedules) }}</div>
        <div>{{ item.credit }}</div>
        <!-- 교수 추가 컬럼 -->
        <template v-if="isProfessor">
          <div>{{ item.academicYear }}학년</div>
          <div>
            <span :class="['status-badge', item.status?.toLowerCase()]">
              {{ LABEL_MAP[item.status] || item.status }}
            </span>
          </div>
        </template>
      </article>
    </DataTable>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goToPage"
    />

  </div>
</template>

<style scoped>
.tbl-row {
  display: grid;
  grid-template-columns: 90px 3fr 130px 180px 130px 60px 70px 80px;
  align-items: center;
  text-align: center;
}
.filter-header .full { justify-content: space-between; width: 100%; }

.status-badge {
  position: static !important;
  transform: none !important;
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}
.status-badge.pending  { background: #fff3e0; color: #ef6c00; }
.status-badge.rejected { background: #ffebee; color: #c62828; }
.status-badge.approved { background: #eafdf6; color: #3e9e7e; }
</style>