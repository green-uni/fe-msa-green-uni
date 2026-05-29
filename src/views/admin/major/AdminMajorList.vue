<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'
import FilterBar from '@/components/common/FilterBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import DataTable from '@/components/common/DataTable.vue'

const router = useRouter()
const modal  = useModalStore()
const searchInput = ref('')

const state = reactive({
  majorList:       [],
  collegeList:     [],
  professorList:   [],
  isLoading:       false,
  activeTab:       'ALL',
  selectedCollege: '',
  currentPage:     1,
  pageSize:        10,
})

const searchQuery = ref('')

function getCollegeName(collegeId) {
  return state.collegeList.find(c => c.collegeId === collegeId)?.name ?? '-'
}

// ↓ [추가] 학과장 코드로 이름을 찾아주는 함수
function getProfessorName(professorCode) {
  if (!professorCode) return '-'
  const prof = state.professorList.find(p => p.memberCode === professorCode)
  return prof ? prof.name : '-' // 매칭되는 교수가 없으면 '-' 반환
}

const BUILDING_LABEL = {
  BUSINESS:    '경영관',
  ENGINEERING: '공학관',
  HUMANITIES:  '인문관',
  ARTS:        '예술관',
  LIBERAL:     '교양관',
  SCIENCE:     '이과관',
}
function getBuildingLabel(val) {
  return BUILDING_LABEL[val] ?? val ?? '-'
}

const TAB_LIST = [
  { label: '전체', value: 'ALL' },
  { label: '정상', value: '정상' },
  { label: '폐지', value: '폐지' },
]

const STATUS_MAP = {
  '정상': { label: '정상', cls: 'badge-running' },
  '폐지': { label: '폐지', cls: 'badge-closed'  },
}

const filteredList = computed(() => {
  const statusOrder = { '정상': 0, '폐지': 1 }
  const keyword = (searchQuery.value || '').trim().toLowerCase()
  const selectedCollegeId = state.selectedCollege ? String(state.selectedCollege) : ''

  return state.majorList
    .filter(m => {
      const mStatus = String(m.active || '').toUpperCase()
      const tabOk = state.activeTab === 'ALL' || mStatus === state.activeTab
      const mCollegeId = String(m.collegeId || '')
      const collegeOk = !selectedCollegeId || mCollegeId === selectedCollegeId
      const mName = (m.name || '').toLowerCase()
      const keywordOk = !keyword || mName.includes(keyword)
      return tabOk && collegeOk && keywordOk
    })
    .sort((a, b) => {
      const statusA = String(a.active || '').toUpperCase()
      const statusB = String(b.active || '').toUpperCase()
      const ao = statusOrder[statusA] ?? 9
      const bo = statusOrder[statusB] ?? 9
      return ao !== bo ? ao - bo : a.name.localeCompare(b.name, 'ko')
    })
})

function getStatusBadge(active) {
  return STATUS_MAP[active?.toUpperCase()] ?? { label: active, cls: 'badge-closed' }
}

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / state.pageSize)))
const pagedList  = computed(() => {
  const s = (state.currentPage - 1) * state.pageSize
  return filteredList.value.slice(s, s + state.pageSize)
})

function onTabChange(tab) {
  state.activeTab = tab
  state.currentPage = 1
}

function onSearch() {
  // searchKeyword -> searchQuery로 변경
  searchQuery.value = searchInput.value.trim() 
  state.currentPage = 1
}

function onSelectMajor(item) {
  searchQuery.value = item.name
  state.currentPage = 1
}

function resetFilter() {
  state.activeTab = 'ALL'
  state.selectedCollege = ''
  searchQuery.value = ''
  state.currentPage = 1
  searchInput.value = ''
}

function goToDetail(id) {
  router.push(`/admin/majors/${id}`)
}

async function fetchData() {
  state.isLoading = true
  try {
    const [majorsRes, collegesRes, professorRes] = await Promise.all([
      majorService.getMajorList(),
      majorService.getCollegeList(),
      majorService.getProfessorList(), 
    ])
    state.majorList     = majorsRes.data?.data   ?? []
    state.collegeList   = collegesRes.data?.data ?? []
    state.professorList = professorRes.data?.data ?? []
  } catch {
    await modal.showAlert('데이터를 불러오지 못했습니다.', 'error')
  } finally {
    state.isLoading = false
  }
}

onMounted(fetchData)

const columns  = ['학과명', '소속대학', '사무실', '전화번호', '학과장명', '입학정원', '전체 교수', '상태']
const gridCols = '1.4fr 1fr 1.2fr 1.2fr 100px 80px 80px 100px'
</script>

<template>
  <div>

    <!--
      searchType 기본값('input')을 유지하되 showSearch=false로 FilterBar 기본 검색 영역을 숨기고,
      SearchInput + 검색 버튼을 슬롯 안에 직접 배치해 우측 정렬
    -->
    <FilterBar
    v-model:searchQuery="searchInput"
      :hasFilter="false"
      placeholder="학과명을 입력하세요"
      @search="onSearch"
      @reset="resetFilter"
    >
      <!-- 탭 -->
      <div class="tab-area">
        <button
          v-for="tab in TAB_LIST"
          :key="tab.value"
          class="filter-btn"
          :class="{ active: state.activeTab === tab.value }"
          @click="onTabChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 대학 선택 -->
      <div class="filter-item">
        <div class="input-label">대학</div>
        <div class="input-content">
          <select v-model="state.selectedCollege" @change="state.currentPage = 1">
            <option value="">전체</option>
            <option v-for="c in state.collegeList" :key="c.collegeId" :value="c.collegeId">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="pagedList"
      :isLoading="state.isLoading"
      :gridCols="gridCols"
      emptyMessage="조회된 학과가 없습니다."
    >
      <template v-if="!state.isLoading && pagedList.length > 0">
        <article
          v-for="m in pagedList"
          :key="m.majorId"
          class="tbl-row"
          :class="{ 'row-disabled': m.active === '폐지' }"
          style="cursor: pointer;"
          @click="goToDetail(m.majorId)"
        >
          <div>{{ m.name }}</div>
          <div>{{ getCollegeName(m.collegeId) }}</div>
          <div>{{ m.majorBuilding ? `${getBuildingLabel(m.majorBuilding)} ${m.room}` : '-' }}</div>
          <div>{{ m.tel ?? '-' }}</div>
          <div>{{ getProfessorName(m.professorCode) }}</div>
          <div>{{ m.capacity ?? '-' }}명</div>
          <div>{{ m.professorCount ?? '-' }}명</div>
          <div>
            <span class="status-badge" :class="getStatusBadge(m.active).cls">
              {{ getStatusBadge(m.active).label }}
            </span>
          </div>
        </article>
      </template>
    </DataTable>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="totalPages"
      :pageGroupSize="5"
      @goToPage="state.currentPage = $event"
    />

  </div>
</template>

<style scoped lang="scss">
.custom-search-area {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}

// FilterBar 내부 .search-btn과 동일한 스타일
.search-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.2s;
  background: $green-600;
  color: #fff;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}
</style>