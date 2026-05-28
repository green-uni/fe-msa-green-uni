<script setup>
import { ref, computed, onMounted } from 'vue'
import scholarshipService from '@/services/scholarshipService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterBar from '@/components/common/FilterBar.vue'

const scholarships = ref([])
const isLoading = ref(false)
const currentPage = ref(1)   // Pagination 컴포넌트용 (1-based)
const totalElements = ref(0)
const pageSize = ref(10)     // FilterBar v-model 연동

// 💡 실시간 필터링을 위한 단일 ref 정의 (참고 스타일 반영)
const selectedYear = ref('')
const selectedSemester = ref('')
const selectedType = ref('')

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

// 💡 데이터에서 연도 추출 함수
const yearOf = (item) => item.parsedYear ? String(item.parsedYear) : ''

// 💡 1. 실제 가공된 데이터 리스트에 존재하는 연도만 추출하여 내림차순 정렬
const yearOptions = computed(() =>
  [...new Set(processedScholarships.value.map(yearOf).filter(Boolean))].sort().reverse()
)

// 💡 2. 필터 조건 중 하나라도 선택되어 있으면 초기화 버튼 활성화
const hasSearchFilter = computed(() => !!selectedYear.value || !!selectedSemester.value || !!selectedType.value)

// 💡 3. 드롭다운 선택 시 즉시 반영되는 실시간 필터링
const filteredScholarships = computed(() => {
  return processedScholarships.value.filter(item => {
    // 1. 연도 필터링
    if (selectedYear.value && yearOf(item) !== selectedYear.value) return false
    
    // 2. 학기 필터링 (타입 통일을 위해 문자열 비교)
    if (selectedSemester.value && String(item.parsedSemester) !== selectedSemester.value) return false
    
    // 3. 장학금 유형 필터링
    if (selectedType.value && item.scholarshipType !== selectedType.value) return false
    
    return true
  })
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
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize.value) || 1)

// 💡 4. 필터 초기화 함수
const resetFilter = () => {
  selectedYear.value = ''
  selectedSemester.value = ''
  selectedType.value = ''
  currentPage.value = 1
}

// 데이터 요청 함수
async function fetchData() {
  isLoading.value = true
  try {
    const { data } = await scholarshipService.getMyScholarships(
      currentPage.value - 1, 
      pageSize.value
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

// 페이지 사이즈 변경 시 데이터를 새로 받아옴
function onPageSizeChange() {
  currentPage.value = 1
  fetchData()
}

function goPage(page) {
  currentPage.value = page
  fetchData()
}

function formatAmount(amount) {
  return Number(amount).toLocaleString('ko-KR')
}

// 날짜 포맷팅 함수
function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

// 배지 디자인 매핑
const BADGE_MAP = {
  성적: 'badge--grade',
  편입학: 'badge--transfer',
  보훈: 'badge--veteran',
  다자녀: 'badge--multi',
}
function badgeClass(type) {
  return BADGE_MAP[type] ?? 'badge--default'
}

onMounted(fetchData)
</script>

<template>
  <div>
    <FilterBar 
      v-model:pageSize="pageSize"
      :hasFilter="hasSearchFilter" 
      :show-search="false"
      :show-count="false"
      :count="totalElements"
      :showPageSize="false"
      :pageSizeOptions="[10, 20, 30, 50]"
      @reset="resetFilter"
      @pageSizeChange="onPageSizeChange"
    >
      <div class="filter-item">
        <div class="input-label">신청 연도</div>
        <div class="input-content">
          <select v-model="selectedYear">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">학기</div>
        <div class="input-content">
          <select v-model="selectedSemester">
            <option value="">전체</option>
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">유형</div>
        <div class="input-content">
          <select v-model="selectedType">
            <option value="">전체</option>
            <option value="성적">성적</option>
            <option value="편입학">편입학</option>
            <option value="보훈">보훈</option>
            <option value="다자녀">다자녀</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <div class="summary-bar">
      <div class="result-count">
        조회 결과: <strong>{{ filteredScholarships.length }}</strong>건
      </div>
      <p>해당 합계: <strong>{{ totalAmountFormatted }}</strong>원</p>
    </div>

    <DataTable
      :columns="['연도', '학기', '유형', '금액', '지급일']"
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
          <div>{{ item.parsedYear ? `${item.parsedYear}년` : '-' }}</div>
          <div>{{ item.parsedSemester ? `${item.parsedSemester}학기` : '-' }}</div>
          <div>
            <span class="badge" :class="badgeClass(item.scholarshipType)">
              {{ item.scholarshipType }}
            </span>
          </div>
          <div>{{ formatAmount(item.scholarshipAmount) }}원</div>
          <div>{{ formatDate(item.createdAt) }}</div>
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
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--font-color-light);
  margin-bottom: 12px;
  strong { color: #16a34a; font-weight: 700; }
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .input-label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #333;
  }
  
  select {
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    outline: none;
    font-size: 0.9rem;
  }
}

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