<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AnnouncementService from '@/services/announcementService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const route  = useRoute()

const anno      = ref(null)
const isLoading = ref(false)

const fetchDetail = async () => {
    isLoading.value = true
    try {
        anno.value = await AnnouncementService.getPublicDetail(route.params.annoId)
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const formatDate = (dateStr) => dateStr?.slice(0, 16).replace('T', ' ') ?? ''

onMounted(fetchDetail)
</script>

<template>
  <div class="page-wrap">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <template v-if="anno">
      <div class="detail-card">
        <div class="card-header">
          <h2>{{ anno.title }}</h2>
          <div class="meta">
            <span>{{ anno.writerName }}</span>
            <span>조회 {{ anno.viewCount }}</span>
            <span>{{ formatDate(anno.createdAt) }}</span>
          </div>
        </div>
        <div class="card-body">{{ anno.content }}</div>
      </div>

      <div class="btn-row">
        <button class="btn-outline" @click="router.push('/public/announcements')">목록으로</button>
        <button class="btn-login" @click="router.push('/login')">로그인</button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-wrap {
  width: 100%; padding: 36px 44px;
  display: flex; flex-direction: column; gap: 16px;
  position: relative; align-self: flex-start;
}

.detail-card {
  border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;
  background: #fff;
}
.card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #eee;
  h2 { font-size: 1.05rem; font-weight: 700; margin: 0 0 10px; color: #1a1a1a; }
  .meta {
    display: flex; gap: 6px; align-items: center;
    font-size: 0.8rem; color: #999;
    span + span::before { content: '·'; margin-right: 6px; }
  }
}
.card-body {
  padding: 24px; min-height: 200px;
  font-size: 0.875rem; line-height: 1.8; color: #333;
  white-space: pre-wrap; word-break: break-word;
}

.btn-row { display: flex; gap: 8px; justify-content: flex-end; }
.btn-outline {
  padding: 7px 16px; border: 1px solid #ccc; border-radius: 6px;
  background: #fff; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #f5f5f5; }
}
.btn-login {
  padding: 7px 16px; background: #2d8659; color: #fff;
  border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;
  &:hover { background: #246b47; }
}
</style>