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
const isLoading  = ref(false)

const GRID_COLS = '60px 1fr 80px 120px'

const fetchList = async () => {
    isLoading.value = true
    try {
        const res = await AnnouncementService.getList({
            page:       currentPage.value,
            size:       10,
            targetRole: filter.targetRole || null,
            search:     searchQuery.value  || null,
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

const rowNum = (idx) => (currentPage.value - 1) * 10 + idx + 1
const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''

watch(() => route.query, fetchList, { immediate: false })

onMounted(() => {
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
      :hasFilter="hasFilter"
      placeholder="제목 검색"
      :showCount="true"
      :count="totalCount"
      @search="onSearch"
      @reset="resetFilter"
    >
      <div class="tab-area">
        <button class="filter-btn" :class="{ active: !filter.targetRole }"
          @click="filter.targetRole = ''; onFilterChange()">전체</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'STUDENT' }"
          @click="filter.targetRole = 'STUDENT'; onFilterChange()">학생</button>
        <button class="filter-btn" :class="{ active: filter.targetRole === 'PROFESSOR' }"
          @click="filter.targetRole = 'PROFESSOR'; onFilterChange()">교수</button>
      </div>
    </FilterBar>

    <div class="list-actions">
      <button class="btn-create" @click="router.push('/admin/announcements/create')">
        + 공지 등록
      </button>
    </div>

    <DataTable
      :columns="['번호', '제목', '조회수', '등록일']"
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
        <div>{{ anno.title }}</div>
        <div>{{ anno.viewCount }}</div>
        <div>{{ formatDate(anno.createdAt) }}</div>
      </article>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="maxPage" :pageGroupSize="10" @goToPage="goToPage" />
  </div>
</template>

<style scoped lang="scss">
.list-actions { display: flex; justify-content: flex-end; margin: 8px 0; }
.btn-create {
  padding: 6px 14px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #246b47; }
}
</style>