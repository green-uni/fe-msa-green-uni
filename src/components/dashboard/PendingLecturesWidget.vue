<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import lectureService from '@/services/lectureService'

const router = useRouter()
const lectures = ref([])
const totalCount = ref(0)

onMounted(async () => {
  try {
    const res = await lectureService.getAdminLectures({ status: 'PENDING', page: 1, size: 3 })
    const page = res.data ?? {}
    lectures.value = page.content ?? []
    totalCount.value = page.totalElements ?? 0
  } catch (e) {
    console.error('강의 승인 대기 목록 로드 실패', e)
  }
})
</script>

<template>
  <div class="widget-card">
    <div class="widget-header">
      <h3>강의 승인 대기 <span class="count">({{ totalCount }}건)</span></h3>
      <RouterLink :to="{ path: '/admin/lectures/my', query: { status: 'PENDING', page: 1 } }" class="view-all">
        전체보기
      </RouterLink>
    </div>

    <ul class="dash-list">
      <li
        v-for="lec in lectures" :key="lec.lectureId"
        class="dash-item pend-item pointer"
        @click="router.push(`/admin/lectures/${lec.lectureId}`)"
      >
        <div class="pend-info">
          <span class="dash-title">{{ lec.lectureName }}</span>
          <span class="pend-sub">{{ lec.proName }} 교수 · {{ lec.majorName }}</span>
        </div>
      </li>
    </ul>

    <div v-if="lectures.length === 0" class="empty-msg">승인 대기 중인 강의가 없습니다.</div>
  </div>
</template>

<style scoped lang="scss">
// pend-item/info/sub/dash-title → MemberDashboard :deep() 관리
.count { color: $font-color-light; font-weight: 400; }
</style>
