<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import FilterBar from '@/components/common/FilterBar.vue'
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
  if (!isFilterValid.value) return
  fetchData()
}

function resetFilter() {
  filter.year = new Date().getFullYear()
  filter.semester = 1
}

function enableEdit(row) {
  row.editAmount = row.baseAmount
  row.isEditing = true
}

function cancelEdit(row) {
  row.isEditing = false
}

async function savePolicy(row) {
  if (!row.editAmount || row.editAmount <= 1000000) {
    await modal.showAlert('등록금 책정액은 1,000,000원보다 커야 합니다.\n금액을 다시 확인해주세요.', 'warning')
    return
  }

  const originalAmount = row.baseAmount

  try {
    isLoading.value = true
    await tuitionService.updatePolicy(row.policyId, row.editAmount)
    row.baseAmount = row.editAmount
    row.isEditing = false
    isLoading.value = false

    await modal.showAlert('등록금 정책이 성공적으로 수정되었습니다.', 'success')
    await fetchData()
  } catch (error) {
    isLoading.value = false
    row.isEditing = false
    row.editAmount = originalAmount

    console.error('서버 에러 디버깅:', error)

    const serverMessage = error.response?.data?.message
                          || error.response?.data
                          || '등록금 정책 수정 중 오류가 발생했습니다.'
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
  <div>

    <FilterBar
      :hasFilter="false"
      :showSearch="false"
      :show-count="searched"
      :count="displayCount"
      @search="onSearch"
      @reset="resetFilter"
    >
      <div class="filter-item">
        <div class="input-label">연도</div>
        <div class="input-content">
          <input
            v-model.number="filter.year"
            type="number"
            min="2000"
            max="2099"
          />
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

      <button
        class="btn btn-submit"
        style="margin-left: auto;"
        :disabled="!isFilterValid || isLoading"
        @click="onSearch"
      >
        <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 조회
      </button>
    </FilterBar>

    <p v-if="!searched" class="guide-text">연도와 학기를 선택한 후 조회하세요.</p>

    <template v-else>
      <DataTable
        :columns="['단과대학', '기본 등록금', '최종 수정일시', '관리']"
        :rows="policies"
        :isLoading="isLoading"
        gridCols="180px 1fr 1fr 100px"
        emptyMessage="해당 학기의 등록금 책정 정책 내역이 없습니다."
      >
        <template v-if="!isLoading && policies.length > 0">
          <article class="tbl-row no-hover" v-for="policy in policies" :key="policy.policyId">
            <div>{{ policy.collegeName }}</div>
            <div v-if="policy.isEditing" class="edit-form">
              <input type="number" v-model.number="policy.editAmount" class="edit-input" />
              <span>원</span>
            </div>
            <div v-else>{{ formatPrice(policy.baseAmount) }}원</div>
            <div>{{ formatDateTime(policy.updatedAt) }}</div>
            <div v-if="policy.isEditing" class="d-flex g5 jc-center">
              <button class="btn btn-submit btn-sm" @click="savePolicy(policy)"><font-awesome-icon icon="fa-solid fa-circle-check" /> 저장</button>
              <button class="btn btn-default btn-sm" @click="cancelEdit(policy)">취소</button>
            </div>
            <div v-else>
              <button
                class="btn btn-default btn-sm"
                :disabled="policy.isHistory || !isEditablePeriod(filter.year, filter.semester) || isPaymentPeriod"
                @click="enableEdit(policy)"
              >수정</button>
            </div>
          </article>
        </template>
      </DataTable>
    </template>

  </div>
</template>

<style scoped lang="scss">
.edit-form { gap: 4px;}
.edit-input { width: 120px; padding: 4px 8px; text-align: right; font-weight: bold;}
</style>
