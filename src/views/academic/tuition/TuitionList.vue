<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router' // 🎯 라우터 이동을 위해 추가
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterBar from '@/components/common/FilterBar.vue' 

const router = useRouter() // 🎯 라우터 인스턴스 생성
const tuitions = ref([])
const isLoading = ref(false)
const currentPage = ref(1)   
const totalElements = ref(0)
const pageSize = ref(10)     

const selectedYear = ref('')
const selectedSemester = ref('')

const yearOf = (item) => item.year ? String(item.year) : ''

const yearOptions = computed(() =>
  [...new Set(tuitions.value.map(yearOf).filter(Boolean))].sort().reverse()
)

const hasSearchFilter = computed(() => !!selectedYear.value || !!selectedSemester.value)

// 💡 1. [수정] 미납, 처리중 상태도 목록에 보이도록 기존 완납 필터 제거 및 통합
const filteredTuitions = computed(() => {
  return tuitions.value.filter(item => {
    // ❌ 기존의 완납 데이터만 남기던 if(!isPaid) return false 조건을 제거했습니다.
    // 이제 모든 상태('미납', '처리중', '완납')가 필터 대상이 됩니다.

    // 1. 연도 필터링
    if (selectedYear.value && yearOf(item) !== selectedYear.value) return false
    
    // 2. 학기 필터링
    if (selectedSemester.value && String(item.semester) !== selectedSemester.value) return false
    
    return true
  })
})

// 납부 완료된 금액 합계 계산 (실시간 필터링된 결과 중 '완납/PAID'인 것만 취합하도록 변경)
const totalAmountFormatted = computed(() => {
  const totalRawSum = filteredTuitions.value.reduce((sum, t) => {
    const isPaid = t.status === '완납' || t.status === '납부완료' || t.status === 'PAID'
    // 완납 상태일 때만 금액을 더해줍니다.
    const amount = isPaid ? (Number(t.finalAmount) || 0) : 0
    return sum + amount
  }, 0)
  
  return Number(totalRawSum).toLocaleString('ko-KR')
})

const maxPage = computed(() => Math.ceil(totalElements.value / pageSize.value) || 1)

const resetFilter = () => { 
  selectedYear.value = ''
  selectedSemester.value = ''
  currentPage.value = 1
}

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
  if (!dateStr || dateStr === '-') return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

// 🎯 2. [추가] 미납 상태일 때만 라우트 이동을 수행하는 핸들러 함수
const handleRowClick = (item) => {
  if (item.status === '미납' || item.status === 'UNPAID') {
    router.push(`/tuitions/${item.tuitionId}`)
  }
  // '완납', '처리중' 등 그 외의 상태는 클릭해도 아무 동작을 하지 않습니다.
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
      :count="filteredTuitions.length"
      :showPageSize="true"
      :pageSizeOptions="[10, 20, 30, 50]"
      @reset="resetFilter"
      @pageSizeChange="onPageSizeChange"
    >
      <div class="filter-item">
        <div class="input-label">연도</div>
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

    <DataTable
      :columns="['연도', '학기', '실납부 금액', '납부 일자', '납부 상태']"
      :rows="filteredTuitions"
      :isLoading="isLoading"
      gridCols="120px 120px 1.5fr 1.5fr 1.2fr"
      emptyMessage="등록금 내역이 존재하지 않습니다."
    >
      <template v-if="!isLoading && filteredTuitions.length > 0">
        <article
          class="tbl-row"
          v-for="(item, idx) in filteredTuitions"
          :key="idx"
          :class="{ pointer: item.status === '미납' || item.status === 'UNPAID' }"
          @click="handleRowClick(item)"
        >
          <div>{{ item.year ? `${item.year}년` : '-' }}</div>
          <div>{{ item.semester ? `${item.semester}학기` : '-' }}</div>
          <div>{{ formatAmount(item.finalAmount) }}원</div>
          <div>{{ item.paidAt ? formatDate(item.paidAt) : '-' }}</div>
          <div>
            <span v-if="item.status === '완납' || item.status === '납부완료' || item.status === 'PAID'">완납</span>
            <span v-else-if="item.status === '처리중' || item.status === 'PENDING'">처리중</span>
            <span v-else>미납</span>
          </div>
        </article>
      </template>
    </DataTable>
    <div class="tbl-summary">
      <div class="tbl-summary-item">
        실납부 합계 <span class="tbl-summary-value">{{ totalAmountFormatted }}원</span>
      </div>
    </div>

    <Pagination
      :currentPage="currentPage"
      :maxPage="maxPage"
      :pageGroupSize="10"
      @goToPage="goPage"
    />
  </div>
</template>

