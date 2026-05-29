<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import tuitionService from '@/services/tuitionService'
import MemberService from '@/services/memberService'
import FilterBar from '@/components/common/FilterBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useModalStore } from '@/stores/modal'

const modal = useModalStore()

const filter = reactive({
  year: 2026,
  semester: 1,
  status: 'UNPAID',
  deptName: '',
  academicYear: '',
})

const searchInput = ref('')
const searchKeyword = ref('')

const tabs = [
  { label: '미납', value: 'UNPAID' },
  { label: '납부', value: 'PAID' },
  { label: '진행중', value: 'PENDING' }
]

const majorOptions = ref([])
const students = ref([])
const totalElements = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = 10
const isLoading = ref(false)

const isMailModalOpen = ref(false)

async function fetchTuitionList() {
  isLoading.value = true
  try {
    const response = await tuitionService.getTuitionList(
      filter.year,
      filter.semester,
      filter.status,
      currentPage.value - 1,
      pageSize
    )
    students.value = response.data?.content || []
    totalElements.value = response.data?.totalElements || 0
    totalPages.value = response.data?.totalPages || 1
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function fetchDepartments() {
  try {
    const res = await MemberService.getMajorList()
    majorOptions.value = res.data ?? []
  } catch (err) {
    console.error('전공 목록 로드 실패:', err)
  }
}

const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const matchDept = !filter.deptName || student.deptName === filter.deptName
    const matchYear = !filter.academicYear || student.academicYear === Number(filter.academicYear)
    const matchKeyword = !searchKeyword.value ||
                         student.studentName.includes(searchKeyword.value) ||
                         student.studentCode.toString().includes(searchKeyword.value)
    return matchDept && matchYear && matchKeyword
  })
})

async function handlePayment(student) {
  const isConfirmed = await modal.showConfirm('납부 완료 상태로 처리하시겠습니까?', 'info')
  if (isConfirmed) {
    try {
      await tuitionService.updateTuitionStatus(student.tuitionId, '납부완료')
      await modal.showAlert('납부 처리가 완료되었습니다.', 'success')
      fetchTuitionList()
    } catch (error) {
      console.error(error)
      modal.showAlert('납부 처리 중 오류가 발생했습니다.', 'error')
    }
  }
}

function openMailModal() {
  isMailModalOpen.value = true
}

async function confirmSendMail() {
  try {
    await tuitionService.sendReminderMails(filter.year, filter.semester)
    await modal.showAlert('미납자 독촉 메일 발송이 완료되었습니다.', 'success')
    isMailModalOpen.value = false
  } catch (error) {
    console.error(error)
    modal.showAlert('메일 발송에 실패했습니다.', 'error')
  }
}

function getStatusLabel(status) {
  const map = { PAID: '완료', PENDING: '진행중', UNPAID: '미납' }
  return map[status] || status
}

function onSearch() {
  searchKeyword.value = searchInput.value.trim()
  currentPage.value = 1
  fetchTuitionList()
}

function resetFilter() {
  filter.year = new Date().getFullYear()
  filter.semester = 1
  filter.status = 'UNPAID'
  filter.deptName = ''
  filter.academicYear = ''
  searchInput.value = ''
  searchKeyword.value = ''
}

function goPage(page) {
  currentPage.value = page
  fetchTuitionList()
}

function formatPrice(value) { return Number(value).toLocaleString('ko-KR') + '원' }
function formatDate(dateStr) { return dateStr ? dateStr.substring(0, 10) : '-' }

onMounted(() => {
  fetchTuitionList()
  fetchDepartments()
})
</script>

<template>
  <div style="position: relative">
    <LoadingSpinner v-if="isLoading" :overlay="true" size="md" />

    <FilterBar
      v-model:searchQuery="searchInput"
      :hasFilter="false"
      placeholder="이름 또는 학번을 입력하세요"
      :show-count="true"
      :count="totalElements"
      @search="onSearch"
      @reset="resetFilter"
    >
      <div class="tab-area">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="filter-btn"
          :class="{ active: filter.status === tab.value }"
          @click="filter.status = tab.value; onSearch()"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="filter-item">
        <div class="input-label">연도</div>
        <div class="input-content">
          <input v-model.number="filter.year" type="number" min="2000" max="2099" />
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">학기</div>
        <div class="input-content">
          <select v-model.number="filter.semester">
            <option :value="1">1학기</option>
            <option :value="2">2학기</option>
          </select>
        </div>
      </div>

      <div class="filter-item">
        <div class="input-label">학과</div>
        <div class="input-content">
          <select v-model="filter.deptName">
            <option value="">전체</option>
            <option v-for="m in majorOptions" :key="m.majorId" :value="m.name">{{ m.name }}</option>
          </select>
        </div>
      </div>
    </FilterBar>

    <DataTable
      :columns="filter.status === 'PENDING'
        ? ['년도', '학기', '학번', '이름', '학과', '납부금액', '상태', '납부일자', '관리']
        : ['년도', '학기', '학번', '이름', '학과', '납부금액', '상태', '납부일자']"
      :rows="filteredStudents"
      :isLoading="isLoading"
      :gridCols="filter.status === 'PENDING'
        ? '70px 60px 110px 110px 1fr 120px 90px 110px 90px'
        : '70px 60px 110px 110px 1fr 120px 90px 110px'"
    >
      <template v-if="!isLoading && filteredStudents.length > 0">
        <article class="tbl-row" v-for="s in filteredStudents" :key="s.tuitionId">
          <div>{{ s.year }}</div>
          <div>{{ s.semester }}</div>
          <div>{{ s.studentCode }}</div>
          <div>{{ s.studentName }}</div>
          <div>{{ s.deptName }}</div>
          <div>{{ formatPrice(s.finalAmount) }}</div>
          <div>{{ getStatusLabel(s.status) }}</div>
          <div>{{ formatDate(s.paidAt) }}</div>
          <div v-if="filter.status === 'PENDING'">
            <button class="btn btn-default history-btn" @click="handlePayment(s)">납부</button>
          </div>
        </article>
      </template>
    </DataTable>

    <Pagination :currentPage="currentPage" :maxPage="totalPages" @goToPage="goPage" />

    <div v-if="filter.status === 'UNPAID'" class="panel-actions mt-md">
      <button class="btn btn-default" @click="openMailModal">미납자 메일 발송</button>
    </div>

    <!-- 미납자 메일 발송 모달 -->
    <div v-if="isMailModalOpen" class="modal-overlay" @click.self="isMailModalOpen = false">
      <div class="mail-modal">
        <header class="modal-header">
          <h3>미납 안내 메일 발송</h3>
          <button class="btn-close" @click="isMailModalOpen = false">&times;</button>
        </header>

        <main class="modal-body">
          <section class="summary-section">
            <h4>발송 대상 요약</h4>
            <table class="summary-table">
              <tbody>
                <tr>
                  <th>미납 학생 수</th>
                  <td class="count-highlight">{{ totalElements }}명</td>
                </tr>
                <tr>
                  <th>대상 학기</th>
                  <td>{{ filter.year }}년 {{ filter.semester }}학기</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="preview-section">
            <h4>발송 메일 미리보기</h4>
            <div class="preview-box">
              <div class="meta-row">
                <strong>제목</strong>
                <span>[그린대학교] {{ filter.year }}년 {{ filter.semester }}학기 등록금 미납 안내</span>
              </div>
              <div class="meta-row"><strong>발신</strong> <span>green.uni502@gmail.com</span></div>
              <div class="meta-row"><strong>수신</strong> <span>미납 학생 전원 ({{ totalElements }}명)</span></div>
              <hr class="preview-divider" />
              <div class="mail-content">
                <p>안녕하세요, 그린대학교 학사지원팀입니다.</p>
                <p>아직 <span class="text-danger">{{ filter.year }}년 {{ filter.semester }}학기 등록금</span>이 납부되지 않았습니다.</p>
                <p>납부기한까지 미납 시 수강이 취소될 수 있으니 빠른 시일 내에 납부해 주시기 바랍니다.</p>
                <p class="margin-top-md">납부 문의: 학사지원팀 02-000-0000</p>
              </div>
            </div>
          </section>

          <div class="warning-alert">
            <span class="alert-icon">⚠</span> 발송 후 취소할 수 없습니다. 내용을 다시 확인 후 발송해 주세요.
          </div>
        </main>

        <footer class="modal-footer">
          <button class="btn btn-default" @click="isMailModalOpen = false">취소</button>
          <button class="btn btn-submit" @click="confirmSendMail">메일 발송</button>
        </footer>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
/* 메일 모달 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex; justify-content: center; align-items: center;
  z-index: 9999;
}
.mail-modal {
  width: 580px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.modal-header {
  background: $font-color-bold;
  color: #fff;
  padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: center;
  h3 { font-size: 16px; margin: 0; font-weight: 500; }
  .btn-close { background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; }
}
.modal-body {
  padding: 20px;
  background: $default-bg;
  display: flex; flex-direction: column; gap: 18px;
  h4 { font-size: 13px; color: $font-color-light; margin-bottom: 8px; font-weight: 600; }
}
.summary-table {
  width: 100%; background: #fff; border: 1px solid $border-color; border-radius: 6px; padding: 12px;
  th { text-align: left; color: $font-color; font-size: 14px; font-weight: 500; padding: 4px 8px; width: 100px; }
  td { text-align: right; color: $font-color-bold; font-size: 14px; font-weight: 500; padding: 4px 8px; }
  .count-highlight { color: $error; font-weight: bold; }
}
.preview-box {
  background: #fff; border: 1px solid $border-color; border-radius: 6px; padding: 16px; font-size: 13px;
  .meta-row { margin-bottom: 6px; display: flex; gap: 15px;
    strong { width: 35px; color: $font-color-light; }
    span { color: $font-color-bold; }
  }
  .preview-divider { border: 0; border-top: 1px solid $border-color; margin: 12px 0; }
  .mail-content { color: $font-color; line-height: 1.6;
    .text-danger { color: $error; font-weight: 500; }
    .margin-top-md { margin-top: 14px; }
  }
}
.warning-alert {
  background: $warning-bg; border: 1px solid $warning-bg; color: $warning;
  padding: 10px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 6px;
}
.modal-footer {
  padding: 12px 20px; background: #fff; border-top: 1px solid $border-color;
  display: flex; justify-content: flex-end; gap: 8px;
}
</style>
