<script setup>
import { ref, onMounted } from 'vue'
import memberService from '@/services/memberService'

const counts = ref({ studentCount: 0, professorCount: 0, adminCount: 0 })

onMounted(async () => {
  try {
    const res = await memberService.getDashboardCounts()
    counts.value = res.data ?? counts.value
  } catch (e) {
    console.error('계정 현황 조회 실패', e)
  }
})
</script>

<template>
  <div class="counts-grid">
    <div class="count-card content-wrap">
      <span class="count-card-label">전체 학생</span>
      <span class="count-card-icon"><font-awesome-icon icon="fa-solid fa-user-group" /></span>
      <span class="count-card-num">{{ Number(counts.studentCount).toLocaleString() }}<em>명</em></span>
    </div>
    <div class="count-card content-wrap">
      <span class="count-card-label">전체 교수</span>
      <span class="count-card-icon"><font-awesome-icon icon="fa-solid fa-user-tie" /></span>
      <span class="count-card-num">{{ Number(counts.professorCount).toLocaleString() }}<em>명</em></span>
    </div>
    <div class="count-card content-wrap">
      <span class="count-card-label">전체 직원</span>
      <span class="count-card-icon"><font-awesome-icon icon="fa-solid fa-users-gear" /></span>
      <span class="count-card-num">{{ Number(counts.adminCount).toLocaleString() }}<em>명</em></span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.counts-grid { display: grid; grid-template-columns: repeat(3, 1fr);  gap: 16px;}
.count-card { display: flex; flex-direction: column; gap: 20px;text-align: center;justify-content: center;padding-top: 10px;
  &-label { font-weight: 600; font-size: 1.1em; }
  &-icon {  background: #ddd;padding: 2px;border-radius: 50%; width: 45px;height: 45px;display: flex; justify-content: center; align-items: center; align-self: center;
    svg{font-size: 1.5em;}
  }
  &-num { font-size: 1.9em;  font-weight: 700; color: $font-color; line-height: 1;
    em { font-size: 0.6em;  font-weight: 400;  color: $font-color-light;  margin-left: 2px;  font-style: normal; }
  }
}
</style>
