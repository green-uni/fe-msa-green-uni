<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AnnouncementService from '@/services/announcementService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useListFilter } from '@/composables/useListFilter'

const route  = useRoute()
const router = useRouter()

const {
  filter, searchQuery, currentPage,
  onFilterChange, onSearch, resetFilter, goToPage, hasFilter,
} = useListFilter({ targetRole: '' })

const annoList   = ref([])
const maxPage    = ref(1)
const totalCount = ref(0)
const pageSize   = ref(10)
const isLoading  = ref(false)
const yearFilter = ref('')

const yearOptions = ref([])

const GRID_COLS = '60px 1fr 120px 80px 120px'

const fetchList = async () => {
    isLoading.value = true
    try {
        const res = await AnnouncementService.getList({
            page:       currentPage.value,
            size:       pageSize.value,
            targetRole: filter.targetRole || null,
            search:     searchQuery.value  || null,
            year:       yearFilter.value   || null,
        })
        annoList.value   = res.content ?? []
        maxPage.value    = res.totalPages ?? 1
        totalCount.value = res.totalElements ?? 0
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const rowNum = (idx) => (currentPage.value - 1) * pageSize.value + idx + 1

function onPageSizeChange() {
    currentPage.value = 1
    fetchList()
}
const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''
const truncate   = (text, max = 20) => text?.length > max ? text.slice(0, max) + '...' : (text ?? '')

watch(() => route.query, fetchList, { immediate: false })

onMounted(async () => {
    yearOptions.value = await AnnouncementService.getYears().catch(() => [])
    const hasUrlQuery = Object.keys(route.query).length > 0
    const stored = sessionStorage.getItem(`listFilter:${route.path}`)
    if (hasUrlQuery || !stored) fetchList()
})
</script>

<template>
  <div style="position: relative;">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <FilterBar
      v-model:searchQuery="searchQuery"
      v-model:pageSize="pageSize"
      :hasFilter="hasFilter"
      placeholder="제목 검색"
      :show-count="true"
      :count="totalCount"
      :show-page-size="true"
      :page-size-options="[10, 20, 30]"
      @search="onSearch"
      @reset="resetFilter"
      @pageSizeChange="onPageSizeChange"
    >
      <div class="tab-area">
        <button class="filter-btn" :class="{ active: !filter.targetRole }"
          @click="filter.targetRole = ''; onFilterChange()">전체</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'STUDENT' }"
          @click="filter.targetRole = 'STUDENT'; onFilterChange()">학생</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'PROFESSOR' }"
          @click="filter.targetRole = 'PROFESSOR'; onFilterChange()">교수</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'MEMBER' }"
          @click="filter.targetRole = 'MEMBER'; onFilterChange()">교내 전체</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'ALL' }"
          @click="filter.targetRole = 'ALL'; onFilterChange()">전체공개</button>
      </div>
      <div class="filter-item">
        <div class="input-label">연도</div>
        <div class="input-content">
          <select v-model="yearFilter" @change="() => { currentPage = 1; fetchList() }">
            <option value="">전체</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="['번호', '제목', '작성자', '조회수', '등록일']"
      :rows="annoList"
      :gridCols="GRID_COLS"
      :isLoading="isLoading"
      emptyMessage="등록된 공지사항이 없습니다."
    >
      <article
        v-for="(anno, idx) in annoList"
        :key="anno.annoId"
        class="tbl-row pointer"
        @click="router.push(`/admin/announcements/${anno.annoId}`)"
      >
        <div>{{ rowNum(idx) }}</div>
        <div style="display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; width:100%">{{ truncate(anno.title) }}</div>
        <div class="tbl-meta">{{ anno.writerName }} ({{ anno.writerCode }})</div>
        <div class="tbl-meta">{{ anno.viewCount }}</div>
        <div class="tbl-meta">{{ formatDate(anno.createdAt) }}</div>
      </article>
    </DataTable>

    <div class="page-footer page-left">
      <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10" @goToPage="goToPage" />
      <button class="btn btn-submit" @click="router.push('/admin/announcements/create')">
        <font-awesome-icon icon="fa-solid fa-plus" /> 공지 등록
      </button>
    </div>
  </div>
</template>

