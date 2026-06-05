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
        anno.value = await AnnouncementService.getDetail(route.params.annoId)
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
  <div class="detail-wrap">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <template v-if="anno">
      <div class="post-card">
        <div class="post-header">
          <h2>{{ anno.title }}</h2>
          <div class="post-meta">
            <span>조회 {{ anno.viewCount }}</span>
            <span>{{ formatDate(anno.createdAt) }}</span>
          </div>
        </div>
        <div class="post-body">{{ anno.content }}</div>
      </div>

      <div class="page-footer">
        <button class="btn btn-default" @click="router.push('/announcements')">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
      </div>
    </template>
  </div>
</template>