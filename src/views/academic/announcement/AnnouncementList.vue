<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AnnouncementService from '@/services/announcementService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import FilterBar from '@/components/common/FilterBar.vue'

const router = useRouter()

const annoList      = ref([])
const currentPage   = ref(1)
const maxPage       = ref(1)
const totalElements = ref(0)
const pageSize      = ref(10)
const isLoading     = ref(false)

const GRID_COLS = '60px 1fr 100px 80px 120px'

const fetchList = async (page = 1) => {
    isLoading.value = true
    try {
        const res = await AnnouncementService.getList({ page, size: pageSize.value })
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

const onPageSizeChange = () => {
    fetchList(1)
}

const rowNum = (idx) => (currentPage.value - 1) * 10 + idx + 1
const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''

onMounted(() => fetchList(1))
</script>

<template>
  <div style="position: relative;">
    <FilterBar
      v-model:pageSize="pageSize"
      :show-search="false"
      :hasFilter="false"
      :show-count="true"
      :count="totalElements"
      :show-page-size="true"
      :page-size-options="[10, 20, 30]"
      @pageSizeChange="onPageSizeChange"
    />
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

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
        @click="router.push(`/announcements/${anno.annoId}`)"
      >
        <div>{{ rowNum(idx) }}</div>
        <div class="tal">{{ anno.title }}</div>
        <div class="tbl-meta">{{ anno.writerName }}</div>
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
</template>