<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AnnouncementService from '@/services/announcementService'

const router    = useRouter()
const authStore = useAuthStore()
const annoList  = ref([])
const loading   = ref(false)

const listPath   = computed(() => authStore.role === 'ADMIN' ? '/admin/announcements' : '/announcements')
const detailPath = (id) => authStore.role === 'ADMIN' ? `/admin/announcements/${id}` : `/announcements/${id}`

onMounted(async () => {
    loading.value = true
    try {
        const res = await AnnouncementService.getList({ page: 1, size: 5 })
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
    <div class="anno-header">
      <span class="anno-title">공지사항</span>
      <router-link :to="listPath" class="anno-more">전체보기</router-link>
    </div>

    <div v-if="loading" class="anno-empty">불러오는 중...</div>
    <div v-else-if="!annoList.length" class="anno-empty">공지사항이 없습니다.</div>

    <ul v-else class="anno-list">
      <li
        v-for="anno in annoList"
        :key="anno.annoId"
        class="anno-item"
        @click="router.push(detailPath(anno.annoId))"
      >
        <span class="anno-dot" />
        <span class="anno-name">{{ anno.title }}</span>
        <time class="anno-date">{{ formatDate(anno.createdAt) }}</time>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.anno-wrap { width: 100%; }

.anno-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.anno-title { font-size: 13px; font-weight: 600; color: $admin-font-color; }
.anno-more {
  font-size: 11px; color: #999; text-decoration: none;
  &:hover { color: $green-600; }
}
.anno-empty {
  font-size: 12px; color: #999; padding: 20px 0; text-align: center;
}
.anno-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
.anno-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;
  &:last-child { border-bottom: none; }
  &:hover .anno-name { color: $green-600; }
}
.anno-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: $green-600; flex-shrink: 0;
}
.anno-name {
  flex: 1; font-size: 12.5px; color: $admin-font-color;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  transition: color 0.15s;
}
.anno-date { font-size: 11px; color: #aaa; flex-shrink: 0; }
</style>