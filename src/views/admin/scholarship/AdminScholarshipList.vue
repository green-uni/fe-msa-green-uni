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
const pageSize = 10

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
const displayCount = computed(() => totalElements.value)
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize) || 1)

function onSearch() {
  // 필수 필터 조건(연도, 학기)이 충족되지 않은 경우 프론트 단에서 요청 방지
  if (!isFilterValid.value) return
  
  searchKeyword.value = searchInput.value.trim()
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
      pageSize
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

const BADGE_MAP = {
  성적: 'badge--grade',
  편입학: 'badge--transfer',
  보훈: 'badge--veteran',
  다자녀: 'badge--multi',
}
function badgeClass(type) {
  return BADGE_MAP[type] ?? 'badge--default'
}

onMounted(() => {
  fetchDepartments()
})
</script>

<template>
  <div>
    <FilterBar 
      v-model:searchQuery="searchInput" 
      :hasFilter="false"
      @search="onSearch" 
      @reset="resetFilter"
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
      <div><p>전체: {{ displayCount }}명</p></div>

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
    </template>
  </div>
</template>

<style scoped lang="scss">
// 🎯 무관한 타이틀 및 브레드크럼 CSS 제거 완료
.guide-text {
  text-align: center;
  padding: 60px 0;
  color: var(--font-color-light);
  font-size: var(--text-sm);
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

// 🎯 불필요한 .filter-header, .filter-group, .search-area 스타일 모두 삭제 완료
</style>