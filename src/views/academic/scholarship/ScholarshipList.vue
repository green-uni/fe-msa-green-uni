<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import scholarshipService from '@/services/scholarshipService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

const scholarships = ref([])
const isLoading = ref(false)
const currentPage = ref(1)   // Pagination 컴포넌트용 (1-based)
const totalElements = ref(0)
const pageSize = 10          // 10개씩 페이징

// 화면 상단의 임시 입력 필터값 (초기값은 비워두어 입력 유도)
const filterInput = reactive({
  year: '',
  semester: '',
  scholarshipType: ''
})

// 💡 [변경] 실제 데이터 필터링에 적용될 확정 검색 조건 객체
// 초기값을 빈 값(null/empty)으로 두어 처음에는 필터 없이 전체가 나오도록 합니다.
const searchParams = reactive({
  year: null,
  semester: null
})

// 백엔드 원본 데이터에 가상 필드(parsedYear, parsedSemester) 결합
const processedScholarships = computed(() => {
  return scholarships.value.map(item => {
    if (!item.createdAt) return { ...item, parsedYear: null, parsedSemester: null }
    
    const date = new Date(item.createdAt)
    const parsedYear = date.getFullYear()
    const month = date.getMonth() + 1
    const parsedSemester = (month >= 1 && month <= 7) ? 1 : 2

    return {
      ...item,
      parsedYear,
      parsedSemester
    }
  })
})

// [실시간 필터링] 
const filteredScholarships = computed(() => {
  return processedScholarships.value.filter(item => {
    // 1. 조회 버튼을 눌러 연도를 지정했을 때만 필터링 (값이 없으면 통과)
    if (searchParams.year && Number(item.parsedYear) !== Number(searchParams.year)) return false
    
    // 2. 조회 버튼을 눌러 학기를 지정했을 때만 필터링 (값이 없으면 통과)
    if (searchParams.semester && Number(item.parsedSemester) !== Number(searchParams.semester)) return false
    
    // 3. 장학금 유형 필터링 (선택 시 즉시 반영)
    if (filterInput.scholarshipType && item.scholarshipType !== filterInput.scholarshipType) return false
    
    return true
  })
})

// 💡 [변경] 전체보기 상태도 지원하므로 유효성 검사 완화 (연도만 있거나, 둘 다 없어도 조회 가능하게 하거나 취향껏 조절)
// 여기서는 연도와 학기가 '입력 중일 때' 버튼이 활성화되도록 하거나, 언제든 조회 가능하게 엽니다.
const isFilterValid = computed(() => {
  // 연도와 학기를 모두 입력했거나, 혹은 아예 둘 다 비워서 '전체 조회' 하거나 둘 다 허용
  if (!filterInput.year && !filterInput.semester) return true
  if (filterInput.year && filterInput.semester) return true
  return false // 하나만 입력했을 때는 버튼 비활성화
})

// 해당 조건 장학금 합계 금액 계산
const totalAmountFormatted = computed(() => {
  const totalRawSum = filteredScholarships.value.reduce((sum, s) => {
    const amount = Number(s.scholarshipAmount) || 0
    return sum + amount
  }, 0)
  
  return Number(totalRawSum).toLocaleString('ko-KR')
})

// 맥스 페이지 계산
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize) || 1)

// '조회' 버튼 클릭 또는 엔터 키 입력 시 호출
function onSearch() {
  // 사용자가 입력한 값을 검색 기준 파라미터로 확정
  searchParams.year = filterInput.year ? Number(filterInput.year) : null
  searchParams.semester = filterInput.semester ? Number(filterInput.semester) : null
  
  currentPage.value = 1
  fetchData()
}

// 엔터키 입력 지원
const keydown = (e) => { if (e.key === 'Enter') onSearch() }

// 데이터 요청 함수 (인자 버그가 없도록 순수하게 page와 size만 전달)
async function fetchData() {
  isLoading.value = true
  try {
    const { data } = await scholarshipService.getMyScholarships(
      currentPage.value - 1, 
      pageSize
    )
    scholarships.value = data.content ?? []
    totalElements.value = data.totalElements ?? 0
  } catch (e) {
    console.error('장학금 목록 조회 실패', e)
    scholarships.value = []
    totalElements.value = 0
  } finally {
    isLoading.value = false
  }
}

function goPage(page) {
  currentPage.value = page
  fetchData()
}

function formatAmount(amount) {
  return Number(amount).toLocaleString('ko-KR')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

const BADGE_MAP = {
  성적: 'badge--grade',
  편입학: 'badge--transfer',
  보훈: 'badge--veteran',
  다자녀: 'badge--multi',
}
function badgeClass(type) {
  return BADGE_MAP[type] ?? 'badge--default'
}

// 💡 [핵심 변경] 컴포넌트가 마운트되자마자 백엔드에서 전체 데이터를 곧바로 당겨옵니다.
onMounted(fetchData)
</script>

<template>
  <div class="container">
    <div class="data-header">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 내 장학금 내역</h2>
      <nav class="breadcrumb">장학금 &gt; 내 장학금 조회</nav>
    </div>

    <div class="filter-header">
      <div class="filter-group">
        <div class="filter-item">
          <div class="input-label">연도</div>
          <div class="input-content">
            <input
              v-model.number="filterInput.year"
              type="number"
              placeholder="전체"
              min="2000"
              max="2099"
              class="year-input-box"
              @keydown="keydown"
            />
          </div>
        </div>

        <div class="filter-item">
          <div class="input-label">학기</div>
          <div class="input-content">
            <select v-model="filterInput.semester">
              <option value="">전체</option>
              <option :value="1">1학기</option>
              <option :value="2">2학기</option>
            </select>
          </div>
        </div>

        <div class="filter-item">
          <div class="input-label">장학금 유형</div>
          <div class="input-content">
            <select v-model="filterInput.scholarshipType">
              <option value="">전체</option>
              <option value="성적">성적</option>
              <option value="편입학">편입학</option>
              <option value="보훈">보훈</option>
              <option value="다자녀">다자녀</option>
            </select>
          </div>
        </div>

        <div class="search-area" style="margin-left: auto;">
          <button
            class="btn search-btn"
            @click="onSearch"
          >
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" />조회
          </button>
        </div>        
      </div>
    </div>

    <div class="summary-bar">
      <p>조회 결과: {{ filteredScholarships.length }}건 (총 {{ totalElements }}건)</p>
      <p>해당 합계: <strong>{{ totalAmountFormatted }}</strong>원</p>
    </div>

    <DataTable
      :columns="['연도', '학기', '장학금 유형', '장학금액', '지급일']"
      :rows="filteredScholarships"
      :isLoading="isLoading"
      gridCols="100px 80px 1.5fr 1fr 1fr"
      emptyMessage="장학 수혜 내역이 존재하지 않습니다."
    >
      <template v-if="!isLoading && filteredScholarships.length > 0">
        <article
          class="tbl-row no-hover"
          v-for="(item, idx) in filteredScholarships"
          :key="idx"
        >
          <div class="mono">{{ item.parsedYear ? `${item.parsedYear}년` : '-' }}</div>
          <div>{{ item.parsedSemester ? `${item.parsedSemester}학기` : '-' }}</div>
          <div>
            <span class="badge" :class="badgeClass(item.scholarshipType)">
              {{ item.scholarshipType }}
            </span>
          </div>
          <div class="amount">{{ formatAmount(item.scholarshipAmount) }}원</div>
          <div class="date">{{ formatDate(item.createdAt) }}</div>
        </article>
      </template>
    </DataTable>

    <Pagination
      :currentPage="currentPage"
      :maxPage="maxPage"
      :pageGroupSize="5"
      @goToPage="goPage"
    />
  </div>
</template>

<style scoped lang="scss">
.page-title {
  font-size: var(--text-xl);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  .title-icon { color: var(--main-color); font-size: 0.8em; }
}
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.filter-header {
  width: 100%;
}

.filter-group {
  display: flex;
  align-items: center; /* 요소들의 세로 중앙 정렬 */
  gap: 16px;           /* 연도와 학기 사이의 간격 */
  width: 100%;
}

/* 검색 영역 안의 input과 버튼도 나란히 배치되도록 수정 */
.search-area {
  display: flex;
  gap: 8px;            /* input과 조회 버튼 사이의 간격 */
}

.summary-bar {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
  color: var(--font-color-light);
  margin-bottom: 8px;
  strong { color: var(--main-color); font-weight: 700; }
}

:deep(.tbl-row) .mono   { font-family: monospace; color: var(--font-color-light); }
:deep(.tbl-row) .amount { font-weight: 600; }
:deep(.tbl-row) .date   { color: var(--font-color-light); }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.badge--grade    { background: #dbeafe; color: #1d4ed8; }
.badge--transfer { background: #ede9fe; color: #6d28d9; }
.badge--veteran  { background: #dcfce7; color: #15803d; }
.badge--multi    { background: #fef9c3; color: #a16207; }
.badge--default  { background: #f3f4f6; color: #6b7280; }
</style>