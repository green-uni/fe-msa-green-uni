<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AnnouncementService from '@/services/announcementService'
import DataTable from '@/components/common/DataTable.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PublicAnnouncementHeader from './PublicAnnouncementHeader.vue'

const router = useRouter()

const annoList      = ref([])
const currentPage   = ref(1)
const maxPage       = ref(1)
const totalElements = ref(0)
const isLoading     = ref(false)
const searchQuery   = ref('')
const searchInput   = ref('')
const yearFilter    = ref('')

const yearOptions = ref([])

const GRID_COLS = '60px 1fr 80px 120px'

const fetchList = async (page = 1) => {
    isLoading.value = true
    try {
        const res = await AnnouncementService.getPublicList({
            page,
            size:   10,
            search: searchInput.value || null,
            year:   yearFilter.value  || null,
        })
        annoList.value      = res.content ?? []
        maxPage.value       = res.totalPages ?? 1
        totalElements.value = res.totalElements ?? 0
        currentPage.value   = page
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const onSearch    = () => { searchInput.value = searchQuery.value; fetchList(1) }
const onYearChange = () => fetchList(1)

const rowNum     = (idx) => totalElements.value - ((currentPage.value - 1) * 10 + idx)
const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''
const truncate   = (text, max = 20) => text?.length > max ? text.slice(0, max) + '...' : (text ?? '')

onMounted(async () => {
    yearOptions.value = await AnnouncementService.getPublicYears().catch(() => [])
    fetchList(1)
})
</script>

<template>
  <div class="page-wrap">
    <PublicAnnouncementHeader />
    <div style="position: relative;">
      <FilterBar
        v-model:searchQuery="searchQuery"
        :show-search="true"
        :hasFilter="false"
        :show-count="true"
        :count="totalElements"
        placeholder="제목 검색"
        @search="onSearch"
      >
        <div class="filter-item">
          <div class="input-label">연도</div>
          <div class="input-content">
            <select v-model="yearFilter" @change="onYearChange">
              <option value="">전체</option>
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
            </select>
          </div>
        </div>
      </FilterBar>
      <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

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
          @click="router.push(`/public/announcements/${anno.annoId}`)"
        >
          <div>{{ rowNum(idx) }}</div>
          <div style="display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; width:100%">{{ truncate(anno.title) }}</div>
          <div class="tbl-meta">{{ anno.viewCount }}</div>
          <div class="tbl-meta">{{ formatDate(anno.createdAt) }}</div>
        </article>
      </DataTable>

      <Pagination
        :currentPage="currentPage"
        :maxPage="maxPage"
        :pageGroupSize="10"
        @goToPage="fetchList"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { align-self: flex-start; width: 100%; padding: 36px 44px; display: flex; flex-direction: column;}
</style>