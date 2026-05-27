<script setup>
import { ref, computed, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterBar from '@/components/common/FilterBar.vue' 

const tuitions = ref([])
const isLoading = ref(false)
const currentPage = ref(1)   // Pagination 컴포넌트용 (1-based)
const totalElements = ref(0)
const pageSize = ref(10)     // FilterBar v-model 연동

// 💡 선택된 필터 상태값 (참고 코딩 스타일 반영)
const selectedYear = ref('')
const selectedSemester = ref('')

// 💡 데이터에서 연도 추출 함수 (item.year가 문자열이든 숫자든 처리)
const yearOf = (item) => item.year ? String(item.year) : ''

// 💡 1. 실제 데이터(tuitions)에 존재하는 연도만 중복 제거 및 내림차순 정렬하여 추출
const yearOptions = computed(() =>
  [...new Set(tuitions.value.map(yearOf).filter(Boolean))].sort().reverse()
)

// 💡 2. 연도나 학기가 하나라도 선택되어 있으면 초기화 버튼 활성화
const hasSearchFilter = computed(() => !!selectedYear.value || !!selectedSemester.value)

// 💡 3. [실시간 필터링 및 납부 상태 조건] 드롭다운 변경 시 즉시 반영
const filteredTuitions = computed(() => {
  return tuitions.value.filter(item => {
    // 0. 납부 상태 기본 필터링 ("완납", "납부완료", "PAID")
    const isPaid = item.status === '완납' || item.status === '납부완료' || item.status === 'PAID'
    if (!isPaid) return false

    // 1. 연도 필터링 (선택되었을 때만)
    if (selectedYear.value && yearOf(item) !== selectedYear.value) return false
    
    // 2. 학기 필터링 (선택되었을 때만, 타입을 문자열로 통일하여 비교)
    if (selectedSemester.value && String(item.semester) !== selectedSemester.value) return false
    
    return true
  })
})

// 납부 완료된 금액 합계 계산 (실시간 필터링된 결과 기준)
const totalAmountFormatted = computed(() => {
  const totalRawSum = filteredTuitions.value.reduce((sum, t) => {
    const amount = Number(t.finalAmount) || 0
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
  currentPage.value = 1
}

// 백엔드 데이터 요청 함수
async function fetchData() {
  isLoading.value = true
  try {
    const response = await tuitionService.getMyTuitionList(
      currentPage.value - 1, 
      pageSize.value
    )
    const data = response?.data
    console.log('내 등록금 납부 내역 응답:', data)

    tuitions.value = data?.content ?? data ?? []
    totalElements.value = data?.totalElements ?? (data?.length ?? 0)
  } catch (e) {
    console.error('등록금 목록 조회 실패', e)
    tuitions.value = []
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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <FilterBar 
      v-model:pageSize="pageSize"
      :hasFilter="hasSearchFilter" 
      :show-search="false"
      :show-count="true"
      :count="totalElements"
      :showPageSize="true"
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
    </FilterBar>

    <div class="summary-bar">
      <div class="result-count">
        조회 결과: <strong>{{ filteredTuitions.length }}</strong>건
      </div>
      <p>실납부 합계 금액: <strong>{{ totalAmountFormatted }}</strong>원</p>
    </div>

    <DataTable
      :columns="['연도', '학기', '실납부 금액', '납부 일자', '납부 상태']"
      :rows="filteredTuitions"
      :isLoading="isLoading"
      gridCols="120px 120px 1.5fr 1.5fr 1.2fr"
      emptyMessage="납부 완료된 등록금 내역이 존재하지 않습니다."
    >
      <template v-if="!isLoading && filteredTuitions.length > 0">
        <article
          class="tbl-row no-hover"
          v-for="(item, idx) in filteredTuitions"
          :key="idx"
        >
          <div class="mono">{{ item.year ? `${item.year}년` : '-' }}</div>
          <div>{{ item.semester ? `${item.semester}학기` : '-' }}</div>
          <div class="amount">{{ formatAmount(item.finalAmount) }}원</div>
          <div class="mono">{{ formatDate(item.paidAt) }}</div>
          <div>
            <span class="badge badge--paid">완납</span>
          </div>
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

:deep(.tbl-row) .mono   { font-family: monospace; color: var(--font-color-light); }
:deep(.tbl-row) .amount { font-weight: 600; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.badge--paid { background: #dcfce7; color: #15803d; }
</style>