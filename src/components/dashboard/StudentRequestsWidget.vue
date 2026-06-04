<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import memberService from '@/services/memberService'
import { APPROVAL_STATUS, MAJOR_REQUEST_TYPE, STATUS_REQUEST_TYPE, BADGE_CLASS } from '@/utils/constants.js'

const TYPE_LABEL_MAP = { STATUS: STATUS_REQUEST_TYPE, MAJOR: MAJOR_REQUEST_TYPE }

const router = useRouter()
const items = ref([])

const formatDate = (dateStr) => dateStr?.slice(0, 10).replaceAll('-', '.')

const extraInfo = (item) => {
  if (item.type === 'ABSENCE') {
    if (item.returnYear != null)
      return `${item.returnYear}년 ${item.returnSemester}학기 복귀 예정`
    if (item.academicYear != null)
      return `${item.academicYear}학년 ${item.semester}학기`
  }
  if (item.requestCategory === 'MAJOR' && item.targetMajorName != null)
    return item.targetMajorName
  return null
}

const goToList = (item) => {
  router.push(item.requestCategory === 'STATUS' ? '/members/status-request' : '/members/major-request')
}

onMounted(async () => {
  try {
    const res = await memberService.getDashboardStudentRequests()
    items.value = res.data ?? []
    console.log(res.data)
  } catch (e) {
    console.error('신청 목록 로드 실패', e)
  }
})
</script>

<template>
  <div class="widget-header">
    <h3>내 신청 처리 목록</h3>
  </div>
  <ul class="dash-list">
    <li v-for="item in items" :key="item.requestId" class="dash-item pointer" @click="goToList(item)">
      <span class="dash-dot" />
      <span class="dash-title type-name">
        {{ TYPE_LABEL_MAP[item.requestCategory]?.[item.type] ?? item.type }} 신청
        <span v-if="extraInfo(item)" class="req-extra"> · {{ extraInfo(item) }}</span>
      </span>
      <span :class="['dash-badge',BADGE_CLASS[item.status] ?? 'badge-pending']">
        {{ APPROVAL_STATUS[item.status] ?? item.status }}
      </span>
      <time class="dash-date">{{ formatDate(item.createdAt) }}</time>
    </li>
  </ul>
  <div v-if="items.length === 0" class="empty-msg">
    신청 내역이 없습니다.
  </div>
</template>

<style scoped lang="scss">
.req-extra { font-size: 13px;font-weight: 400; color: $font-color-light;}
</style>
