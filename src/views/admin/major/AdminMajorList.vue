<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import majorService from '@/services/majorService'
import { useModalStore } from '@/stores/modal'
import Pagination from '@/components/common/Pagination.vue'

const router = useRouter()
const modal  = useModalStore()

const state = reactive({
  majorList:   [],
  collegeList: [],
  isLoading:   false,
  activeTab:       'ALL',
  selectedCollege: '',
  searchKeyword:   '',
  currentPage: 1,
  pageSize:    10,
})

function getCollegeName(collegeId) {
  return state.collegeList.find(c => c.collegeId === collegeId)?.name ?? '-'
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
  const keyword = (state.searchKeyword || '').trim().toLowerCase()
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

function onTabChange(tab) { state.activeTab = tab; state.currentPage = 1 }
function onSearch()       { state.currentPage = 1 }
function goToEdit(id)     { router.push(`/admin/majors/${id}/edit`) }

async function fetchData() {
  state.isLoading = true
  try {
    const [majorsRes, collegesRes] = await Promise.all([
      majorService.getMajorList(),
      majorService.getCollegeList(),
    ])
    state.majorList   = majorsRes.data?.data   ?? []
    state.collegeList = collegesRes.data?.data ?? []
  } catch {
    await modal.showAlert('데이터를 불러오지 못했습니다.', 'error')
  } finally {
    state.isLoading = false
  }
}

onMounted(fetchData)

const columns  = ['학과명', '소속대학', '사무실', '전화번호', '학과장코드', '입학정원', '교수 수', '상태']
const gridCols = '1.4fr 1fr 1.1fr 1.2fr 0.9fr 0.7fr 0.7fr 0.7fr'
</script>

<template>
  <div>
    <div class="data-header" style="margin-bottom:16px;">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 학과 조회</h2>
      <nav class="breadcrumb">학과 &gt; 학과 조회</nav>
    </div>

    <div class="filter-header">
      <div class="tab-area">
        <button
          v-for="tab in TAB_LIST" :key="tab.value"
          class="filter-btn" :class="{ active: state.activeTab === tab.value }"
          @click="onTabChange(tab.value)"
        >{{ tab.label }}</button>
      </div>

      <div class="d-flex ai-center g10">
        <div class="filter-group">
          <div class="filter-item">
            <label class="input-label">대학</label>
            <div class="input-content">
              <select v-model="state.selectedCollege" @change="state.currentPage = 1">
                <option value="">전체</option>
                <option v-for="c in state.collegeList" :key="c.collegeId" :value="c.collegeId">
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="search-area">
          <input v-model="state.searchKeyword" type="text" placeholder="학과명을 입력하세요" @keydown.enter="onSearch" />
          <button class="btn search-btn" @click="onSearch">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
          </button>
        </div>
      </div>
    </div>

    <section class="tbl-wrap" :style="`--grid-cols: ${gridCols}`">
      <article class="tbl-head">
        <div v-for="col in columns" :key="col">{{ col }}</div>
      </article>

      <template v-if="!state.isLoading && pagedList.length > 0">
        <article
          v-for="m in pagedList" :key="m.majorId"
          class="tbl-row" :class="{ 'row-disabled': m.active === '폐지' }"
          style="cursor:pointer;"
          @click="goToEdit(m.majorId)"
        >
          <div>{{ m.name }}</div>
          <div>{{ getCollegeName(m.collegeId) }}</div>
          <div>{{ m.majorBuilding ? `${getBuildingLabel(m.majorBuilding)} ${m.room}` : '-' }}</div>
          <div>{{ m.tel ?? '-' }}</div>
          <div>{{ m.professorCode ?? '-' }}</div>
          <div>{{ m.capacity ?? '-' }}</div>
          <div>{{ m.professorCount ?? '-' }}</div>
          <div>
            <span class="status-badge" :class="getStatusBadge(m.active).cls">
              {{ getStatusBadge(m.active).label }}
            </span>
          </div>
        </article>
      </template>

      <article v-if="state.isLoading" class="no-data"><p>불러오는 중...</p></article>
      <article v-else-if="pagedList.length === 0" class="no-data"><p>조회된 데이터가 없습니다.</p></article>
    </section>

    <Pagination
      :currentPage="state.currentPage"
      :maxPage="totalPages"
      :pageGroupSize="5"
      @goToPage="state.currentPage = $event"
    />
  </div>
</template>

<style scoped lang="scss">
.page-title {
  font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px;
  .title-icon { color: var(--main-color); font-size: 0.8em; }
}
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }

.tbl-wrap { width: 100%; display: grid; }
.tbl-head, .tbl-row {
  display: grid; grid-template-columns: var(--grid-cols);
  align-items: center; text-align: center;
}
.tbl-head {
  font-size: var(--text-sm); font-weight: bold; background: #f5f5f5;
  border-radius: 5px; margin-bottom: 5px; border: 1px solid var(--table-border-color);
  div { padding: 10px; }
}
.tbl-row {
  background: #fff; border: 1px solid var(--table-border-color); border-top-width: 0;
  &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
  &:last-child     { border-radius: 0 0 5px 5px; }
  &:hover { background: var(--hover-bg-color); }
  div { padding: 12px 10px; line-height: 1.2; position: relative; }
}
.row-disabled div { color: #ccc; }
.no-data {
  grid-column: 1 / -1; text-align: center; color: #aaa; padding: 40px 0;
  background: #fff; border: 1px solid var(--table-border-color); border-radius: 0 0 5px 5px;
}

.status-badge { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.badge-running { background: #eafdf6; color: #3e9e7e; }
.badge-closed  { background: #f5f5f5; color: #aaa; }
</style>