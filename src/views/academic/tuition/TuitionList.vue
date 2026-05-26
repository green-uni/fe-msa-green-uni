<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

const tuitions = ref([])
const isLoading = ref(false)
const currentPage = ref(1)   // Pagination 컴포넌트용 (1-based)
const totalElements = ref(0)
const pageSize = 10          // 10개씩 페이징

// 화면 상단의 임시 입력 필터값
const filterInput = reactive({
  year: '',
  semester: ''
})

// 실제 데이터 필터링에 적용될 확정 검색 조건 객체
const searchParams = reactive({
  year: null,
  semester: null
})

// [실시간 필터링 적용] -> 백엔드가 주는 한글 상태값("완납" 또는 "납부완료") 완벽 조율
const filteredTuitions = computed(() => {
  return tuitions.value.filter(item => {
    // 0. 납부 상태가 '완납', '납부완료', 'PAID' 중 하나인 데이터만 통과
    const isPaid = item.status === '완납' || item.status === '납부완료' || item.status === 'PAID';
    if (!isPaid) return false

    // 1. 조회 버튼을 눌러 연도를 지정했을 때만 필터링 (값이 없으면 통과)
    if (searchParams.year && Number(item.year) !== Number(searchParams.year)) return false
    
    // 2. 조회 버튼을 눌러 학기를 지정했을 때만 필터링 (값이 없으면 통과)
    if (searchParams.semester && Number(item.semester) !== Number(searchParams.semester)) return false
    
    return true
  })
})

// 납부 완료된 금액 합계 계산 (finalAmount 필드명 교정)
const totalAmountFormatted = computed(() => {
  const totalRawSum = filteredTuitions.value.reduce((sum, t) => {
    const amount = Number(t.finalAmount) || 0
    return sum + amount
  }, 0)
  
  return Number(totalRawSum).toLocaleString('ko-KR')
})

// 맥스 페이지 계산
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize) || 1)

// '조회' 버튼 클릭 또는 엔터 키 입력 시 호출
function onSearch() {
  searchParams.year = filterInput.year ? Number(filterInput.year) : null
  searchParams.semester = filterInput.semester ? Number(filterInput.semester) : null
  
  currentPage.value = 1
  fetchData()
}

// 엔터키 입력 지원
const keydown = (e) => { if (e.key === 'Enter') onSearch() }

// 백엔드 데이터 요청 함수
async function fetchData() {
  isLoading.value = true
  try {
    const response = await tuitionService.getMyTuitionList(
      currentPage.value - 1, 
      pageSize
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
    isLoading.value = false;
  }
}

function goPage(page) {
  currentPage.value = page
  fetchData()
}

function formatAmount(amount) {
  return Number(amount).toLocaleString('ko-KR')
}

// 💡 납부일자(paidAt) 포맷팅용 헬퍼 함수
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
  <div class="container">
    <div class="data-header">
      <h2 class="page-title"><span class="title-icon">►</span> 내 등록금 납부 내역</h2>
      <nav class="breadcrumb">등록금 &gt; 내 등록금 납부 내역</nav>
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

        <div class="search-area" style="margin-left: auto;">
          <button
            class="btn search-btn"
            @click="onSearch"
          >
            조회
          </button>
        </div>        
      </div>
    </div>

    <div class="summary-bar">
      <p>조회 결과: {{ filteredTuitions.length }}건 (총 {{ totalElements }}건)</p>
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
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-area {
  display: flex;
  gap: 8px;
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

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: var(--text-sm);
  font-weight: 600;
}
.badge--paid { background: #dcfce7; color: #15803d; }  /* 완납 초록색 고정 */
</style>