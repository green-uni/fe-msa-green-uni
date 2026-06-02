<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import memberService from '@/services/memberService'

const router = useRouter()
const items = ref([])
const totalCount = ref(0)

const majorSubText = (item) => {
  if (item.type === 'TRANSFER') {
    return `전과: ${item.currentMajorName} → ${item.targetMajorName}`
  }
  if (item.type === 'MINOR') {
    return item.currentMinorName
      ? `부전공: ${item.currentMinorName} → ${item.targetMajorName}`
      : `부전공: ${item.targetMajorName}`
  }
  return `${item.currentMajorName} → ${item.targetMajorName}`
}

onMounted(async () => {
  try {
    const res = await memberService.getDashboardMajorRequests()
    items.value = res.data ?? []
    totalCount.value = res.total ?? 0
  } catch (e) {
    console.error('전공변경 신청 대기 목록 로드 실패', e)
  }
})
</script>

<template>
  <div class="widget-card">
    <div class="widget-header">
      <h3>전공 변경 승인 대기 <span class="count">({{ totalCount }}건)</span></h3>
      <RouterLink to="/admin/members/major-request" class="view-all">전체보기</RouterLink>
    </div>

    <ul class="dash-list">
      <li
        v-for="item in items" :key="item.requestId"
        class="dash-item pend-item pointer"
        @click="router.push(`/admin/members/major-request/${item.requestId}`)"
      >
        <div class="pend-info">
          <span class="dash-title">{{ majorSubText(item) }}</span>
          <span class="pend-sub">{{ item.memberCode }} · {{ item.studentName }} · {{ item.academicYear }}학년</span>
        </div>
      </li>
    </ul>

    <div v-if="items.length === 0" class="empty-msg">승인 대기 중인 신청이 없습니다.</div>
  </div>
</template>

<style scoped lang="scss">
// pend-item/info/top/sub/dash-title → MemberDashboard :deep() 관리
.count { color: $font-color-light; font-weight: 400; }
</style>
