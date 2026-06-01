<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
  totalPages:      1,
  totalElements:   0,
})

// ─── 탭 & 상태 매핑 ──────────────────────────────────────────────

const TAB_LIST = [
  { label: '전체', value: 'ALL' },
  { label: '정상', value: 'RUNNING' },
  { label: '폐지', value: 'CLOSED' },
]

const STATUS_MAP = {
  RUNNING: { label: '정상', cls: 'badge-running' },
  CLOSED: { label: '폐지', cls: 'badge-closed'  },
}

const BUILDING_LABEL = {
  BUSINESS:    '경영관',
  ENGINEERING: '공학관',
  HUMANITIES:  '인문관',
  ARTS:        '예술관',
  LIBERAL:     '교양관',
  SCIENCE:     '이과관',
}

// ─── 헬퍼 함수 ───────────────────────────────────────────────────

function getCollegeName(collegeId) {
  return state.collegeList.find(c => c.collegeId === collegeId)?.name ?? '-'
}

function getProfessorName(professorCode) {
  if (!professorCode) return '-'
  const prof = state.professorList.find(p => p.memberCode === professorCode)
  return prof ? prof.name : '-'
}

function getBuildingLabel(val) {
  return BUILDING_LABEL[val] ?? val ?? '-'
}

function getStatusBadge(active) {
  const key = String(active || '').toUpperCase()
  return STATUS_MAP[key] ?? { label: active, cls: 'badge-closed' }
}

// ─── 서버 사이드 페이징 데이터 fetch ─────────────────────────────
async function fetchMajorList() {
  state.isLoading = true
  try {
    const status = state.activeTab === 'ALL' ? null : state.activeTab
    const search = searchInput.value.trim() || null
    const page   = state.currentPage - 1   // 0-based

    const res = await majorService.getMajorList({
      status,
      search,
      page,
      size: state.pageSize,
    })

    // Spring Page 응답 구조: { content, totalPages, totalElements, ... }
    const pageData          = res.data?.data ?? {}
    state.majorList         = pageData.content       ?? []
    state.totalPages        = pageData.totalPages    ?? 1
    state.totalElements     = pageData.totalElements ?? 0
  } catch {
    await modal.showAlert('데이터를 불러오지 못했습니다.', 'error')
  } finally {
    state.isLoading = false
  }
}

async function fetchStaticData() {
  try {
    const [collegesRes, professorRes] = await Promise.all([
      majorService.getCollegeList(),
      majorService.getProfessorList(),
    ])
    state.collegeList   = collegesRes.data?.data  ?? []
    state.professorList = professorRes.data?.data ?? []
  } catch {
    await modal.showAlert('기초 데이터를 불러오지 못했습니다.', 'error')
  }
}

// ─── 이벤트 핸들러 ───────────────────────────────────────────────

function onTabChange(tab) {
  state.activeTab   = tab
  state.currentPage = 1
  fetchMajorList()
}

function onSearch() {
  state.currentPage = 1
  fetchMajorList()
}

function resetFilter() {
  state.activeTab   = 'ALL'
  searchInput.value = ''
  state.currentPage = 1
  fetchMajorList()
}

function onPageChange(page) {
  state.currentPage = page
  fetchMajorList()
}

function goToDetail(id) {
  router.push(`/admin/majors/${id}`)
}

// ─── 마운트 ──────────────────────────────────────────────────────

onMounted(async () => {
  await fetchStaticData()
  await fetchMajorList()
})

// ─── 테이블 설정 ─────────────────────────────────────────────────

const columns  = ['학과명', '소속대학', '사무실', '전화번호', '학과장명', '입학정원', '전체 교수', '상태']
const gridCols = '1.4fr 1fr 1.2fr 1.2fr 100px 80px 80px 100px'
</script>

<template>
  <div>
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

      <!-- 대학 선택: 프론트 필터이므로 제거하거나 서버 파라미터로 확장 시 여기서 추가 -->
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="state.majorList"
      :isLoading="state.isLoading"
      :gridCols="gridCols"
      emptyMessage="조회된 학과가 없습니다."
    >
      <template v-if="!state.isLoading && state.majorList.length > 0">
        <article
          v-for="m in state.majorList"
          :key="m.majorId"
          class="tbl-row"
          :class="{ 'row-disabled': String(m.active).toUpperCase() === 'CLOSED' }"
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
      :maxPage="state.totalPages"
      :pageGroupSize="5"
      @goToPage="onPageChange"
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