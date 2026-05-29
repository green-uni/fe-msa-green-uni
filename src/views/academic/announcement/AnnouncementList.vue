<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AnnouncementService from '@/services/announcementService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()

const annoList    = ref([])
const currentPage = ref(1)
const maxPage     = ref(1)
const isLoading   = ref(false)

const GRID_COLS = '60px 1fr 100px 80px 120px'

const fetchList = async (page = 1) => {
    isLoading.value = true
    try {
        const res = await AnnouncementService.getList({ page, size: 10 })
        annoList.value    = res.content ?? []
        maxPage.value     = res.totalPages ?? 1
        currentPage.value = page
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const rowNum = (idx) => (currentPage.value - 1) * 10 + idx + 1
const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''

onMounted(() => fetchList(1))
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <h2>공지사항</h2>
    </div>

    <div style="position: relative;">
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
          <div>{{ anno.title }}</div>
          <div>{{ anno.writerName }}</div>
          <div>{{ anno.viewCount }}</div>
          <div>{{ formatDate(anno.createdAt) }}</div>
        </article>
      </DataTable>

      <Pagination
        v-if="maxPage > 1"
        :currentPage="currentPage"
        :maxPage="maxPage"
        :pageGroupSize="10"
        @goToPage="fetchList"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-wrap { display: flex; flex-direction: column; gap: 16px; }
.page-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
</style>