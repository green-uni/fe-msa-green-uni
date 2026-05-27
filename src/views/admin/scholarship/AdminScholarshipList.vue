<script setup>
import { ref, computed, reactive, onMounted } from 'vue' // 🎯 onMounted 추가
import scholarshipService from '@/services/scholarshipService'
import MemberService from '@/services/memberService' // 🎯 MSA 환경의 전체 학과 조회를 위해 추가
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

const scholarships = ref([])
const isLoading = ref(false)
const searched = ref(false)
const currentPage = ref(1)     // Pagination 컴포넌트용 (1-based)
const totalElements = ref(0)
const pageSize = 10             // 백엔드가 허용하는 안전한 사이즈 (10개씩)

const searchInput = ref('')     // 사용자가 입력 중인 텍스트
const searchKeyword = ref('')

// 🎯 학생 관리 화면 컨벤션과 맞춰 가져온 전체 전공 목록을 담을 변수
const majorOptions = ref([])

const filter = reactive({
  year: new Date().getFullYear(),
  semester: '',
  scholarshipType: '',
  deptName: '', // ScholarshipRes DTO의 deptName 매핑 유지
  academicYear: ''
})

// ❌ 기존 목록 데이터 기준의 uniqueDepartments computed 속성은 제거했습니다.

const filteredScholarships = computed(() => {
  return scholarships.value.filter(item => {
    // 1. 장학금 유형 필터링
    if (filter.scholarshipType && item.scholarshipType !== filter.scholarshipType) return false
    
    // 2. 학과 필터링
    if (filter.deptName && item.deptName !== filter.deptName) return false
    
    // 3. 학년 필터링
    if (filter.academicYear && item.academicYear !== Number(filter.academicYear)) return false
    
    // 4. 우측 텍스트 인풋 검색어 필터링 (학번 또는 이름 기준)
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      const matchName = item.studentName?.toLowerCase().includes(keyword)
      const matchCode = String(item.memberCode).includes(keyword)
      if (!matchName && !matchCode) return false
    }
    
    return true
  })
})

// 필터 유효성 검사
const isFilterValid = computed(() => filter.year && filter.semester !== '')

// 전체 개수 표시
const displayCount = computed(() => totalElements.value)

// 백엔드 전체 개수 기준 맥스 페이지 계산
const maxPage = computed(() => Math.ceil(totalElements.value / pageSize) || 1)

// 버튼 클릭 시 호출: 1페이지로 초기화하고 서버에서 새로 가져옴
function onSearch() {
  searchKeyword.value = searchInput.value.trim()
  currentPage.value = 1
  fetchData()
}

// 엔터키 입력 시 조회 실행
const keydown = (e) => { if (e.key === 'Enter') onSearch() }

async function fetchData() {
  isLoading.value = true
  searched.value = true
  try {
    const { data } = await scholarshipService.getScholarshipList(
      filter.year,
      filter.semester,
      currentPage.value - 1, // 백엔드는 0부터 시작하므로 -1
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

// 🎯 2. 전체 DB 학과 목록 가져오기 로직 추가
async function fetchDepartments() {
  try {
    const res = await MemberService.getMajorList()
    majorOptions.value = res.data ?? []
  } catch (err) {
    console.error('전공 목록 로드 실패:', err)
  }
}

// 페이지 번호 클릭 시 호출할 함수
function goPage(page) {
  currentPage.value = page
  fetchData() // 해당 페이지 데이터 요청
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

// 🎯 마운트 시점에 DB에 등록된 활성화 학과 리스트를 사전 동기화
onMounted(() => {
  fetchDepartments()
})
</script>

<template>
  <div>

    <div class="filter-header">
      <div class="filter-group">
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
            <select v-model.number="filter.semester">
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

        <div class="filter-item">
        <div class="input-label">학년</div>
        <div class="input-content">
            <select v-model="filter.academicYear" :disabled="!searched">
            <option value="">전체</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
            <option value="4">4학년</option>
            </select>
        </div>
        </div>
        <div class="search-area" style="margin-left: auto;">
          <input
            v-model="searchInput"
            type="text"
            placeholder="검색어를 입력하세요"
            :disabled="!searched"
            @keydown="keydown"
          />
          <button
          class="btn search-btn"
          :disabled="!isFilterValid || isLoading"
          @click="onSearch"
        >
          <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 조회
        </button>
        </div>        
      </div>
    </div>

    <p v-if="!searched" class="guide-text">연도와 학기를 선택한 후 조회하세요.</p>

    <template v-else>
      <div><p>전체: {{ displayCount }}명</p></div>

        <DataTable
        :columns="['학번', '이름', '학과', '학년', '유형', '금액', '지급일']"
        :rows="filteredScholarships"  :isLoading="isLoading"
        gridCols="120px 1fr 1fr 60px 150px 1fr 120px"
        emptyMessage="해당 학기의 장학 수혜 내역이 없습니다."
        >
            <template v-if="!isLoading && filteredScholarships.length > 0">
                <article
                class="tbl-row no-hover"
                v-for="(item, idx) in filteredScholarships" 
                :key="idx"
                >
                <div class="mono">{{ item.memberCode }}</div>
                <div>{{ item.studentName }}</div>
                <div>{{ item.deptName }}</div> <div>{{ item.academicYear }}학년</div>
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
    </template>
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

.guide-text {
  text-align: center;
  padding: 60px 0;
  color: var(--font-color-light);
  font-size: var(--text-sm);
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
</style>