<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import tuitionService from '@/services/tuitionService'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToTuition() {
  router.push('/admin/tuition')
}

// Chart.js 필수 요소 등록
ChartJS.register(ArcElement, Tooltip, Legend)

// 관리자 대시보드 고정 조회 기준 (2026년 1학기)
const targetYear = 2026
const targetSemester = 1

// DB에서 받아올 실시간 데이터 상태 관리
const paidCount = ref(0)
const unpaidCount = ref(0)
const pendingCount = ref(0) // 🎯 대기중(진행중) 상태 추가
const isLoading = ref(false)

// 🎯 문자열 결합 오류 해결: 숫자로 명확하게 연산하여 총합 계산
const totalCount = computed(() => Number(paidCount.value) + Number(unpaidCount.value) + Number(pendingCount.value))

// DB 데이터 로드 API 함수
async function fetchTuitionStatusSummary() {
  isLoading.value = true
  try {
    // 1. 납부 완료(PAID) 데이터 조회
    const paidRes = await tuitionService.getTuitionList(targetYear, targetSemester, 'PAID', 0, 1)
    paidCount.value = paidRes.data?.totalElements || 0

    // 2. 미납(UNPAID) 데이터 조회
    const unpaidRes = await tuitionService.getTuitionList(targetYear, targetSemester, 'UNPAID', 0, 1)
    unpaidCount.value = unpaidRes.data?.totalElements || 0

    // 3. 🎯 진행중/대기중(PENDING) 데이터 조회 추가
    const pendingRes = await tuitionService.getTuitionList(targetYear, targetSemester, 'PENDING', 0, 1)
    pendingCount.value = pendingRes.data?.totalElements || 0
    
  } catch (error) {
    console.error('대시보드 등록금 현황 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

// Chart.js 동적 데이터 바인딩 (대기중 데이터 및 색상 추가)
const chartData = computed(() => {
  return {
    datasets: [
      {
        // 🎯 순서대로 초록색(완료), 노란색(대기중), 붉은색(미납)
        backgroundColor: ['#73A300', '#CA8A04', '#9E2A2B'], 
        data: [paidCount.value, pendingCount.value, unpaidCount.value],
        borderWidth: 0,
        cutout: '75%'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  }
}

onMounted(() => {
  fetchTuitionStatusSummary()
})
</script>

<template>
  <div class="tuition-container">
    <div class="tuition-header">
      <span class="title">등록금 납부 현황</span>
      <button class="view-all-btn" @click="goToTuition">전체보기</button>
    </div>

    <div v-if="isLoading" class="loading-box">데이터를 불러오는 중입니다...</div>

    <div v-else class="tuition-content">
      <div class="chart-wrapper">
        <Doughnut v-if="totalCount > 0" :data="chartData" :options="chartOptions" />
        <div v-else class="no-data-chart"></div>
        
        <div class="chart-center-text">
          <span class="total-num">{{ totalCount.toLocaleString() }}</span>
        </div>
      </div>

      <div class="legend-list">
        <div class="legend-item">
          <div class="label-side">
            <span class="dot paid-dot"></span>
            <span class="label-text">납부 완료</span>
          </div>
          <span class="count-text"><strong>{{ paidCount.toLocaleString() }}</strong>명</span>
        </div>

        <div class="legend-item">
          <div class="label-side">
            <span class="dot pending-dot"></span>
            <span class="label-text">대기중</span>
          </div>
          <span class="count-text pending-color"><strong>{{ pendingCount.toLocaleString() }}</strong>명</span>
        </div>
        
        <div class="legend-item">
          <div class="label-side">
            <span class="dot unpaid-dot"></span>
            <span class="label-text">미납</span>
          </div>
          <span class="count-text unpaid-color"><strong>{{ unpaidCount.toLocaleString() }}</strong>명</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tuition-container {
  border: 1px solid #DCE3EB;
  border-radius: 4px;
  padding: 20px;
  background-color: #ffffff;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;
}

.tuition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tuition-header .title {
  font-size: 16px;
  font-weight: 700;
  color: #1A2530;
}

.view-all-btn {
  background: none;
  border: none;
  color: #7A8B9A;
  font-size: 12px;
  cursor: pointer;
}

.tuition-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 20px;
}

.loading-box {
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}

.chart-wrapper {
  position: relative;
  width: 110px;
  height: 110px;
}

.no-data-chart {
  width: 100%;
  height: 100%;
  border: 12px solid #f1f5f9;
  border-radius: 50%;
  box-sizing: border-box;
}

.chart-center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.total-num {
  font-size: 16px;
  font-weight: 700;
  color: #1A2530;
}

.legend-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.label-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.paid-dot { background-color: #73A300; }
.pending-dot { background-color: #CA8A04; } /* 🎯 대기중 노란색 색상 코드 추가 */
.unpaid-dot { background-color: #9E2A2B; }

.label-text { color: #4A5568; }
.count-text { color: #1A2530; }
.pending-color { color: #CA8A04; } /* 🎯 텍스트 컬러 지정 */
.unpaid-color { color: #9E2A2B; }
</style>