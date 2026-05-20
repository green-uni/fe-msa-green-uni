<script setup>
import { ref, reactive, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

const filter = reactive({
  year: 2026,
  semester: 1,
  status: 'UNPAID',
  deptName: '',
  academicYear: '',
  keyword: ''
})

const tabs = [
  { label: '미납', value: 'UNPAID' },
  { label: '납부', value: 'PAID' },
  { label: '진행중', value: 'PENDING' }
]

const students = ref([])
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = 5
const isLoading = ref(false)

async function fetchTuitionList() {
  isLoading.value = true
  try {
    const response = await tuitionService.getTuitionList(
      filter.year, filter.semester, filter.status, 
      currentPage.value - 1, pageSize
    )
    students.value = response.data?.content || []
    totalElements.value = response.data?.totalElements || 0
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function getStatusLabel(status) {
  const map = { PAID: '완료', PENDING: '진행중', UNPAID: '미납' }
  return map[status] || status
}

function onSearch() {
  currentPage.value = 1
  fetchTuitionList()
}

function goPage(page) {
  currentPage.value = page
  fetchTuitionList()
}

function formatPrice(value) { return Number(value).toLocaleString('ko-KR') + '원' }
function formatDate(dateStr) { return dateStr ? dateStr.substring(0, 10) : '-' }

onMounted(fetchTuitionList)
</script>

<template>
  <div class="container">
    <div class="data-header">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 학생 목록 조회</h2>
      <nav class="breadcrumb">등록금 관리 &gt; 학생 목록 조회</nav>
    </div>

    <div class="filter-header">
      <div class="tab-area">
        <button v-for="tab in tabs" :key="tab.value" class="filter-btn" 
                :class="{ active: filter.status === tab.value }" 
                @click="filter.status = tab.value; onSearch()">
          {{ tab.label }}
        </button>
      </div>

      <div class="filter-group">
        <input type="number" v-model.number="filter.year" class="input-box" placeholder="연도" />
        <select v-model.number="filter.semester" class="select-box">
          <option :value="1">1학기</option>
          <option :value="2">2학기</option>
        </select>
        <select v-model="filter.deptName" class="select-box"><option value="">학과 전체</option></select>
        <select v-model="filter.academicYear" class="select-box"><option value="">학년 전체</option></select>
        <input v-model="filter.keyword" class="input-box" placeholder="이름 또는 학번 검색" />
        <button class="btn search-btn" @click="onSearch">조회</button>
      </div>
    </div>

    <div class="table-meta">
      <p>전체: {{ totalElements }}명</p>
      <button v-if="filter.status === 'UNPAID'" class="btn-mail" @click="sendMail">미납자 메일 발송</button>
    </div>

<DataTable
  :columns="['학번', '성명', '학과', '학년', '납부금액', '상태', '납부일자', '납부기한']"
  :rows="students"
  :isLoading="isLoading"
  gridCols="100px 100px 1fr 80px 120px 80px 120px 120px" 
>
  <template v-if="!isLoading && students.length > 0">
    <article class="tbl-row" v-for="s in students" :key="s.tuitionId">
      <div class="mono">{{ s.studentCode }}</div>
      <div>{{ s.studentName }}</div>
      <div>{{ s.deptName }}</div>
      <div>{{ s.academicYear }}학년</div>
      <div class="price">{{ formatPrice(s.finalAmount) }}</div>
      <div><span class="badge" :class="s.status.toLowerCase()">{{ getStatusLabel(s.status) }}</span></div>
      <div class="mono">{{ formatDate(s.paidAt) }}</div>
      <div class="mono">{{ formatDate(s.deadline) }}</div>
    </article>
  </template>
</DataTable>

    <Pagination :currentPage="currentPage" :maxPage="Math.ceil(totalElements / pageSize) || 1" @goToPage="goPage" />
  </div>
</template>

<style scoped lang="scss">
.page-title { font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px; .title-icon { color: var(--main-color); font-size: 0.8em; } }
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); margin-bottom: 20px; }

/* 탭 및 필터 헤더 */
.tab-area { display: flex; gap: 4px; }
.filter-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
.filter-group { display: flex; gap: 10px; align-items: flex-end; }
.filter-btn { padding: 8px 20px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; color: #64748b; font-weight: 500; }
.filter-btn.active { background: var(--main-color); color: #fff; border-color: var(--main-color); }

.input-label { font-size: var(--text-sm); font-weight: 600; margin-bottom: 4px; display: block; }
.input-box, .select-box { padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; height: 38px; }
.search-btn { background: var(--main-color); color: #fff; border: none; padding: 0 16px; cursor: pointer; height: 38px; }

/* 테이블 행 */
:deep(.data-table) {
  display: flex;
  flex-direction: column;
}

/* 데이터 행의 그리드 설정 */
:deep(.tbl-row) { 
  display: grid !important; 
  /* 위에서 적은 gridCols 값과 정확히 일치해야 합니다 */
  grid-template-columns: 100px 100px 1fr 80px 120px 80px 120px 120px !important;
  align-items: center; 
  padding: 12px; 
  border-bottom: 1px solid #f1f5f9; 
  text-align: center; 
}

/* 만약 위 설정 후에도 헤더(columns)가 안 맞는다면, 
   해당 컴포넌트의 헤더 영역 클래스를 찾아서 아래처럼 동일하게 지정해야 합니다.
*/
:deep(.header-row) { 
  display: grid !important;
  grid-template-columns: 100px 100px 1fr 80px 120px 80px 120px 120px !important;
}
.mono { font-family: monospace; color: #64748b; }
.price { font-weight: 600; }

/* 뱃지 및 버튼 */
.badge { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
.badge.unpaid { background: #fee2e2; color: #991b1b; }
.badge.paid { background: #dcfce7; color: #166534; }
.badge.pending { background: #fef3c7; color: #92400e; }

.btn-mail { 
  background: #ea580c; 
  color: #fff; 
  border: none; 
  padding: 6px 16px; 
  border-radius: 4px; 
  cursor: pointer; 
}
.btn-table-action { padding: 4px 8px; border: 1px solid var(--main-color); color: var(--main-color); background: #fff; border-radius: 4px; cursor: pointer; }

.table-meta { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 10px; 
}
</style>