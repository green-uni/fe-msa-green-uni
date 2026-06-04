<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import scholarshipService from '@/services/scholarshipService'
import MemberService from '@/services/memberService'
import FilterBar from '@/components/common/FilterBar.vue' // 🎯 FilterBar 컴포넌트 임포트 추가
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

const scholarships = ref([])
const isLoading = ref(false)
const searched = ref(false)
const currentPage = ref(1)
const totalElements = ref(0)
const pageSize = ref(10)

const searchInput = ref('') // FilterBar의 내부 검색어와 동기화될 변수
const searchKeyword = ref('')
const majorOptions = ref([])

const filter = reactive({
  year: new Date().getFullYear(),
  semester: '',
  scholarshipType: '',
  deptName: '',
  academicYear: ''
})

const filteredScholarships = computed(() => {
  return scholarships.value.filter(item => {
    if (filter.scholarshipType && item.scholarshipType !== filter.scholarshipType) return false
    if (filter.deptName && item.deptName !== filter.deptName) return false
    if (filter.academicYear && item.academicYear !== Number(filter.academicYear)) return false
    
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      const matchName = item.studentName?.toLowerCase().includes(keyword)
      const matchCode = String(item.memberCode).includes(keyword)
      if (!matchName && !matchCode) return false
    }
    
    return true
  })
})

const isFilterValid = computed(() => filter.year && filter.semester !== '')
const hasFilter = computed(() =>
  filter.semester !== '' || filter.scholarshipType !== '' ||
  filter.deptName !== '' || filter.academicYear !== '' || searchInput.value.trim() !== ''
)
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize.value) || 1)

function onSearch() {
  // 필수 필터 조건(연도, 학기)이 충족되지 않은 경우 프론트 단에서 요청 방지
  if (!isFilterValid.value) return
  searchKeyword.value = searchInput.value.trim()
  currentPage.value = 1
  fetchData()
}

function onPageSizeChange() {
  currentPage.value = 1
  fetchData()
}

// 🎯 FilterBar의 리셋 기능 대응 (필요시 호출)
function resetFilter() {
  filter.year = new Date().getFullYear()
  filter.semester = ''
  filter.scholarshipType = ''
  filter.deptName = ''
  filter.academicYear = ''
  searchInput.value = ''
  searchKeyword.value = ''
}

async function fetchData() {
  isLoading.value = true
  searched.value = true
  try {
    const { data } = await scholarshipService.getScholarshipList(
      filter.year,
      filter.semester,
      currentPage.value - 1,
      pageSize.value
    )
    
    scholarships.value = data.content ?? []
    totalElements.value = data.totalElements ?? 0
  } catch (e) {
    console.error('장학 수혜 목록 조회 실패', e)
    scholarships.value = []
    totalElements.value = 0
  } finally {
    isLoading.value = false
  }
}

async function fetchDepartments() {
  try {
    const res = await MemberService.getMajorList()
    majorOptions.value = res.data ?? []
  } catch (err) {
    console.error('전공 목록 로드 실패:', err)
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

onMounted(() => {
  fetchDepartments()
})
</script>

<template>
  <div>
    <FilterBar
      v-model:searchQuery="searchInput"
      v-model:pageSize="pageSize"
      :hasFilter="hasFilter"
      :show-count="true"
      :count="totalElements"
      :show-page-size="true"
      :page-size-options="[10, 20, 30]"
      @search="onSearch"
      @reset="resetFilter"
      @pageSizeChange="onPageSizeChange"
    >
      <div class="filter-item">
        <div class="input-label">연도</div>
        <div class="input-content">
          <input
            v-model.number="filter.year"
            type="number"
            min="2000"
            max="2099"
          />
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">학기</div>
        <div class="input-content">
          <select v-model.number="filter.semester" @change="onSearch">
            <option value="" disabled>학기 선택</option>
            <option :value="1">1학기</option>
            <option :value="2">2학기</option>
          </select>
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">유형</div>
        <div class="input-content">
          <select v-model="filter.scholarshipType" :disabled="!searched">
            <option value="">전체</option>
            <option value="성적">성적</option>
            <option value="편입학">편입학</option>
            <option value="보훈">보훈</option>
            <option value="다자녀">다자녀</option>
          </select>
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">학과</div>
        <div class="input-content">
          <select v-model="filter.deptName" :disabled="!searched">
            <option value="">전체</option>
            <option v-for="m in majorOptions" :key="m.majorId" :value="m.name">
              {{ m.name }}
            </option>
          </select>
        </div>
      </div>
    </FilterBar>

    <p v-if="!searched" class="guide-text">연도와 학기를 선택한 후 조회하세요.</p>

    <template v-else>
      <DataTable
        :columns="['학번', '이름', '학과', '유형', '금액', '지급일']"
        :rows="filteredScholarships"  
        :isLoading="isLoading"
        gridCols="120px 1fr 1fr 150px 1fr 120px"
        emptyMessage="해당 학기의 장학 수혜 내역이 없습니다."
      >
        <template v-if="!isLoading && filteredScholarships.length > 0">
          <article
            class="tbl-row no-hover"
            v-for="(item, idx) in filteredScholarships" 
            :key="idx"
          >
            <div>{{ item.memberCode }}</div>
            <div>{{ item.studentName }}</div>
            <div>{{ item.deptName }}</div>
            <div>{{ item.scholarshipType }}</div>
            <div>{{ formatAmount(item.scholarshipAmount) }}원</div>
            <div>{{ formatDate(item.createdAt) }}</div>
          </article>
        </template>
      </DataTable>

      <Pagination
        :currentPage="currentPage"
        :maxPage="maxPage"
        :pageGroupSize="10"
        @goToPage="goPage"
      />
    </template>
  </div>
</template>

