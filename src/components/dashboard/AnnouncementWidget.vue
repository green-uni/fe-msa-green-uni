<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AnnouncementService from '@/services/announcementService'

const router = useRouter()
const authStore = useAuthStore()
const annoList = ref([])
const loading = ref(false)

const listPath = computed(() => authStore.role === 'ADMIN' ? '/admin/announcements' : '/announcements')
const detailPath = (id) => authStore.role === 'ADMIN' ? `/admin/announcements/${id}` : `/announcements/${id}`

onMounted(async () => {
  loading.value = true
  try {
    const res = await AnnouncementService.getList({ page: 1, size: 4 })
    annoList.value = res.content ?? []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateStr) => dateStr?.slice(0, 10) ?? ''
</script>

<template>
  <div class="anno-wrap">
    <div class="widget-header">
      <h3>공지사항</h3>
      <router-link :to="listPath" class="view-all">전체보기</router-link>
    </div>

    <div v-if="loading" class="empty-msg">불러오는 중...</div>
    <div v-else-if="!annoList.length" class="empty-msg">공지사항이 없습니다.</div>

    <ul v-else class="dash-list">
      <li v-for="anno in annoList" :key="anno.annoId" class="dash-item pointer"
        @click="router.push(detailPath(anno.annoId))">
        <span class="dash-dot" />
        <span class="dash-title">{{ anno.title }}</span>
        <time class="dash-date">{{ formatDate(anno.createdAt) }}</time>
      </li>
    </ul>
  </div>
</template>