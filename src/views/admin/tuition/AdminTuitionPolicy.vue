<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import { useModalStore } from '@/stores/modal'

const modal = useModalStore()

const filter = reactive({
  year: 2026,
  semester: 1
})

const policies = ref([])
const isLoading = ref(false)
const searched = ref(false)
const isPaymentPeriod = ref(false)

const isFilterValid = computed(() => filter.year && filter.semester !== '')
const displayCount = computed(() => policies.value.length)

function isEditablePeriod(targetYear, targetSemester) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentSemester = now.getMonth() + 1 <= 6 ? 1 : 2

  if (targetYear < currentYear) return false
  if (targetYear === currentYear && targetSemester < currentSemester) return false
  
  return true
}

async function fetchData() {
  isLoading.value = true
  searched.value = true

  try {
    const periodRes = await tuitionService.getPaymentPeriod()
    isPaymentPeriod.value = periodRes.data.isPaymentPeriod

    if (isEditablePeriod(filter.year, filter.semester)) {
      const response = await tuitionService.getPolicies()
      const allData = response.data || []
      policies.value = allData.map(p => ({
        ...p,
        isHistory: false,
        isEditing: false,
        editAmount: p.baseAmount
      }))
    } else {
      const response = await tuitionService.getPolicyHistories(filter.year, filter.semester)
      const historyData = response.data || []
      policies.value = historyData.map(h => ({
        policyId: h.policyId,
        collegeName: h.collegeName,
        baseAmount: h.baseAmount,
        updatedAt: h.createdAt,
        updatedBy: h.updatorCode,
        isHistory: true,
        isEditing: false
      }))
    }
  } catch (error) {
    console.error('데이터 조회 실패:', error)
    policies.value = []
  } finally {
    isLoading.value = false
  }
}

function onSearch() {
  fetchData()
}

function enableEdit(row) {
  row.editAmount = row.baseAmount
  row.isEditing = true
}

function cancelEdit(row) {
  row.isEditing = false
}

async function savePolicy(row) {
  // 1. 프론트엔드 자체 최소 금액 검증 (1,000,000원 이하 차단)
  if (!row.editAmount || row.editAmount <= 1000000) {
    // 🌟 스토어 명세에 맞춰 showAlert(메시지, 타입) 형태로 변경했습니다.
    await modal.showAlert('등록금 책정액은 1,000,000원보다 커야 합니다.\n금액을 다시 확인해주세요.', 'warning')
    return 
  }
  
  const originalAmount = row.baseAmount;

  try {
    isLoading.value = true
    
    // 백엔드로 전송 (여기서 백엔드가 100만원 이하 검증 후 예외를 반환함)
    await tuitionService.updatePolicy(row.policyId, row.editAmount)
        
    row.baseAmount = row.editAmount
    row.isEditing = false
    isLoading.value = false
    
    // 🌟 수정 성공 알림창 호출
    await modal.showAlert('등록금 정책이 성공적으로 수정되었습니다.', 'success')

    await fetchData()

  } catch (error) {
    isLoading.value = false 
    row.isEditing = false
    row.editAmount = originalAmount

    console.error('서버 에러 디버깅:', error)
    
    // 백엔드(Spring)에서 throw한 IllegalStateException 메시지 가로채기
    const serverMessage = error.response?.data?.message 
                          || error.response?.data 
                          || '등록금 정책 수정 중 오류가 발생했습니다.';
      
    // 🌟 백엔드가 보내준 경고 메시지를 그대로 팝업에 연동
    await modal.showAlert(serverMessage, 'error')
  }
}

function formatPrice(value) {
  return Number(value).toLocaleString('ko-KR')
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="container">
    <div class="data-header">
      <h2 class="page-title"><span class="title-icon">&#9658;</span> 등록금 정책 관리</h2>
      <nav class="breadcrumb">등록금 관리 &gt; 정책 관리</nav>
    </div>

    <div class="filter-header">
      <div class="filter-group">
        <div class="filter-item">
          <div class="input-label">연도</div>
          <div class="input-content">
            <input type="number" v-model.number="filter.year" min="2000" max="2099" />
          </div>
        </div>
        <div class="filter-item">
          <div class="input-label">학기</div>
          <div class="input-content">
            <select v-model.number="filter.semester">
              <option value="" disabled>학기 선택</option>
              <option :value="1">1학기</option>
              <option :value="2">2학기</option>
            </select>
          </div>
        </div>
        <div class="search-area" style="margin-left: auto;">
          <button class="btn search-btn" :disabled="!isFilterValid || isLoading" @click="onSearch">
            <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 조회
          </button>
        </div>
      </div>
    </div>

    <p v-if="!searched" class="guide-text">연도와 학기를 선택한 후 조회하세요.</p>

    <template v-else>
      <div class="count-summary">
        <p>전체: {{ displayCount }}건</p>
      </div>

      <DataTable
        :columns="['정책 ID', '단과대학 명칭', '기본 등록금 책정액', '최종 수정일시', '수정자', '관리']"
        :rows="policies"
        :isLoading="isLoading"
        gridCols="120px 180px 1fr 180px 120px 140px"
        emptyMessage="해당 학기의 등록금 책정 정책 내역이 없습니다."
      >
        <template v-if="!isLoading && policies.length > 0">
          <article class="tbl-row no-hover" v-for="policy in policies" :key="policy.policyId">
            <div class="mono font-bold">{{ policy.policyId }}</div>
            <div class="college-code">{{ policy.collegeName }}</div>
            <div>
              <div v-if="policy.isEditing" class="edit-form">
                <input type="number" v-model.number="policy.editAmount" class="edit-input" />
                <span class="unit">원</span>
              </div>
              <div v-else class="price-display">
                {{ formatPrice(policy.baseAmount) }}원
              </div>
            </div>
            <div class="mono date-text">{{ formatDateTime(policy.updatedAt) }}</div>
            <div class="mono updator-text">{{ policy.updatedBy || '-' }}</div>
            <div>
              <div v-if="policy.isEditing" class="btn-actions">
                <button class="btn-save-sm" @click="savePolicy(policy)">저장</button>
                <button class="btn-cancel-sm" @click="cancelEdit(policy)">취소</button>
              </div>
              <button 
                v-else 
                class="btn-edit" 
                :disabled="policy.isHistory || !isEditablePeriod(filter.year, filter.semester) || isPaymentPeriod"
                :class="{ 'btn-disabled': policy.isHistory || !isEditablePeriod(filter.year, filter.semester) || isPaymentPeriod }"
                @click="enableEdit(policy)"
              >
                수정
              </button>
            </div>
          </article>
        </template>
      </DataTable>
    </template>
  </div>
</template>

<style scoped lang="scss">
.page-title { font-size: var(--text-xl); font-weight: 600; display: flex; align-items: center; gap: 8px; .title-icon { color: var(--main-color); font-size: 0.8em; } }
.breadcrumb { font-size: var(--text-sm); color: var(--font-color-light); }
.guide-text { text-align: center; padding: 60px 0; color: var(--font-color-light); font-size: var(--text-sm); }
.count-summary { margin-bottom: 12px; font-size: var(--text-sm); color: #334155; font-weight: 500; }
:deep(.tbl-row) .mono { font-family: monospace; color: var(--font-color-light); }
.font-bold { font-weight: 600; color: #1e293b; }
.college-code { font-weight: 500; color: #334155; }
.price-display { font-weight: 600; color: #1e293b; text-align: right; padding-right: 24px; }
.edit-form { display: flex; align-items: center; justify-content: flex-end; padding-right: 24px; gap: 4px; }
.edit-input { width: 120px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: right; font-weight: 600; font-size: 13px; }
.unit { font-size: 13px; color: #475569; }
.date-text { color: var(--font-color-light); font-size: 13px; }
.updator-text { color: #475569; }
.btn-edit { padding: 4px 14px; border: 1px solid #cbd5e1; background: #fff; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.btn-edit:hover:not(:disabled) { background: #f1f5f9; }
.btn-disabled { background: #f1f5f9 !important; color: #94a3b8 !important; border-color: #e2e8f0 !important; cursor: not-allowed !important; }
.btn-actions { display: flex; gap: 4px; justify-content: center; }
.btn-save-sm { padding: 4px 10px; background: var(--main-color, #2e7d32); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn-cancel-sm { padding: 4px 10px; background: #64748b; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.filter-header { width: 100%; margin-bottom: 20px; }
.filter-group { display: flex; align-items: center; gap: 16px; width: 100%; }
.search-area { display: flex; gap: 8px; }
</style>