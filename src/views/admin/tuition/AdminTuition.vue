<script setup>
import { ref, reactive, onMounted } from 'vue'
import tuitionService from '@/services/tuitionService'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'

// 검색 필터 변수 (기본값 설정)
const filter = reactive({
  year: 2026,
  semester: 1,
  status: 'UNPAID' // 기본값: 미납 탭
})

// 상태 탭 관리를 위한 배열
const tabs = [
  { label: '미납', value: 'UNPAID' },
  { label: '납부', value: 'PAID' },
  { label: '진행중', value: 'PENDING' }
]

// 데이터 바인딩 변수
const students = ref([])
const totalElements = ref(0)
const currentPage = ref(1)
const pageSize = 10
const isLoading = ref(false)

// 모달 제어 전용 상태값
const isMailModalOpen = ref(false)
const isStatusModalOpen = ref(false)
const selectedTuitionId = ref(null)

// 메일 프리뷰 데이터 객체
const mailPreview = ref({
  unpaidCount: 0,
  year: 2026,
  semester: 1,
  dueDate: '',
  mailSubject: '',
  mailFrom: '',
  mailBodyPreview: ''
})

// 학생 리스트 조회 (백엔드 페이징은 0-indexed 처리)
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
  } catch (error) {
    console.error('학생 목록 조회 실패:', error)
    students.value = []
    totalElements.value = 0
  } finally {
    isLoading.value = false
  }
}

// 탭 변경 헬퍼 함수
function changeTab(statusValue) {
  filter.status = statusValue
  currentPage.value = 1
  fetchTuitionList()
}

// 검색 핸들러
function onSearch() {
  currentPage.value = 1
  fetchTuitionList()
}

function handlePageChange(page) {
  currentPage.value = page
  fetchTuitionList()
}

// 미납자 메일 프리뷰 모달 열기
async function openMailModal() {
  try {
    const response = await tuitionService.previewReminders(filter.year, filter.semester)
    mailPreview.value = response.data
    isMailModalOpen.value = true
  } catch (error) {
    alert('메일 미리보기를 불러오지 못했습니다.')
  }
}

// 최종 메일 발송 처리
async function sendMails() {
  try {
    await tuitionService.sendReminderMails(filter.year, filter.semester)
    alert('미납 독촉 메일이 성공적으로 발송 대기열(Kafka)에 등록되었습니다.')
    isMailModalOpen.value = false
  } catch (error) {
    alert('메일 발송 요청에 실패했습니다.')
  }
}

// 납부 완료 처리 컨펌 모달 열기
function openStatusModal(tuitionId) {
  selectedTuitionId.value = tuitionId
  isStatusModalOpen.value = true
}

// 최종 납부 완납 승인 처리
async function confirmStatusChange() {
  if (!selectedTuitionId.value) return
  try {
    await tuitionService.updateTuitionStatus(selectedTuitionId.value, 'PAID')
    alert('납부 완료 상태로 처리되었습니다.')
    isStatusModalOpen.value = false
    await fetchTuitionList()
  } catch (error) {
    alert('상태 변경 처리에 실패했습니다.')
  }
}

function formatPrice(value) {
  return Number(value).toLocaleString('ko-KR')
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}

onMounted(() => {
  fetchTuitionList()
})
</script>

<template>
  <div class="admin-container">
    <div class="page-header">
      <h2 class="page-title">► 등록금 학생 목록 조회</h2>
      <nav class="breadcrumb">등록금 &gt; 학생 목록 조회</nav>
    </div>

    <div class="filter-card">
      <div class="tab-group">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          class="tab-btn"
          :class="{ active: filter.status === tab.value }"
          @click="changeTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="search-inputs">
        <div class="input-item">
          <span>년도</span>
          <input type="number" v-model.number="filter.year" class="input-box" />
        </div>
        <div class="input-item">
          <span>학기</span>
          <select v-model.number="filter.semester" class="select-box">
            <option :value="1">1학기</option>
            <option :value="2">2학기</option>
          </select>
        </div>
        <button class="btn-search" @click="onSearch">🔍 검색</button>
      </div>
    </div>

    <div class="table-meta">
      <span class="total-count">전체: <strong>{{ totalElements }}</strong>개</span>
      <button 
        v-if="filter.status === 'UNPAID'" 
        class="btn-action btn-mail" 
        @click="openMailModal"
      >
        미납자 메일 보내기
      </button>
    </div>

    <DataTable
      :columns="filter.status === 'PENDING' 
        ? ['년도', '학기', '학번', '이름', '납부금액', '상태', '납부일자', '납부기한', '관리']
        : ['년도', '학기', '학번', '이름', '납부금액', '상태', '납부일자', '납부기한']"
      :rows="students"
      :isLoading="isLoading"
      :gridCols="filter.status === 'PENDING'
        ? '80px 80px 120px 100px 140px 100px 140px 140px 100px'
        : '80px 80px 120px 100px 140px 100px 140px 140px'"
    >
      <template v-if="!isLoading && students.length > 0">
        <div class="tbl-row" v-for="student in students" :key="student.tuitionId">
          <div>{{ student.year }}</div>
          <div>{{ student.semester }}학기</div>
          <div class="mono">{{ student.studentCode }}</div>
          <div>{{ student.studentName || 'ooo' }}</div>
          <div class="price">{{ formatPrice(student.finalAmount) }}원</div>
          <div>
            <span class="badge" :class="student.status.toLowerCase()">
              {{ student.status === 'PAID' ? '완료' : student.status === 'PENDING' ? '진행중' : '미납' }}
            </span>
          </div>
          <div class="mono">{{ formatDate(student.paidAt) }}</div>
          <div class="mono">{{ formatDate(student.deadline) }}</div>
          <div v-if="filter.status === 'PENDING'">
            <button class="btn-table-action" @click="openStatusModal(student.tuitionId)">납부</button>
          </div>
        </div>
      </template>
    </DataTable>

    <Pagination
      :currentPage="currentPage"
      :maxPage="Math.ceil(totalElements / pageSize) || 1"
      @goToPage="handlePageChange"
    />

    <div class="modal-overlay" v-if="isMailModalOpen">
      <div class="modal-box mail-modal">
        <div class="modal-header">
          <h3>미납 안내 메일 발송</h3>
          <button class="close-btn" @click="isMailModalOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="summary-section">
            <h4>발송 대상 요약</h4>
            <div class="grid-summary">
              <div>미납 학생 수</div><div class="highlight">{{ mailPreview.unpaidCount }}명</div>
              <div>대상 학기</div><div>{{ mailPreview.year }}년 {{ mailPreview.semester }}학기</div>
              <div>납부기한</div><div>{{ formatDate(mailPreview.dueDate) }}</div>
            </div>
          </div>
          <div class="preview-section">
            <h4>발송 메일 미리보기</h4>
            <div class="mail-field"><strong>제목:</strong> {{ mailPreview.mailSubject }}</div>
            <div class="mail-field"><strong>발신:</strong> {{ mailPreview.mailFrom }}</div>
            <div class="mail-field"><strong>수신:</strong> 미납 학생 전원</div>
            <div class="mail-content-box" v-html="mailPreview.mailBodyPreview"></div>
          </div>
          <p class="warn-text">⚠️ 발송 후 취소할 수 없습니다. 내용을 다시 확인 후 발송해 주세요.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="isMailModalOpen = false">취소</button>
          <button class="btn-confirm" @click="sendMails">메일 발송</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="isStatusModalOpen">
      <div class="modal-box confirm-modal">
        <div class="modal-body text-center">
          <p class="confirm-message">납부 완료 상태로 처리하시겠습니까?</p>
        </div>
        <div class="modal-footer justify-center">
          <button class="btn-cancel" @click="isStatusModalOpen = false">취소</button>
          <button class="btn-confirm-action" @click="confirmStatusChange">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { padding: 24px; font-family: sans-serif; color: #333; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: bold; color: #111; }
.breadcrumb { font-size: 13px; color: #666; }

.filter-card { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin-bottom: 20px; }
.tab-group { display: flex; gap: 4px; }
.tab-btn { padding: 8px 20px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-size: 14px; border-radius: 4px; }
.tab-btn.active { background: #2e7d32; color: #fff; border-color: #2e7d32; font-weight: bold; }

.search-inputs { display: flex; align-items: center; gap: 16px; }
.input-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.input-box { width: 80px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
.select-box { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 4px; }
.btn-search { padding: 6px 16px; background: #475569; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }

.table-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.total-count { font-size: 14px; color: #475569; }
.btn-mail { padding: 8px 16px; background: #c2410c; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }

.tbl-row { display: grid; align-items: center; padding: 12px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 14px; }
.tbl-row:hover { background-color: #f8fafc; }
.mono { font-family: monospace; color: #4a5568; }
.price { font-weight: 600; text-align: right; padding-right: 12px; }

.badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
.badge.unpaid { background: #fee2e2; color: #991b1b; }
.badge.paid { background: #dcfce7; color: #166534; }
.badge.pending { background: #fef3c7; color: #92400e; }
.btn-table-action { padding: 4px 12px; border: 1px solid #2e7d32; color: #2e7d32; background: #fff; border-radius: 4px; cursor: pointer; font-size: 12px; }
.btn-table-action:hover { background: #e8f5e9; }

/* 공통 레이어 모달 CSS 스타일 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); overflow: hidden; }
.mail-modal { width: 600px; max-width: 90%; }
.confirm-modal { width: 400px; padding: 24px; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #1e293b; color: #fff; }
.modal-header h3 { font-size: 16px; margin: 0; }
.close-btn { background: none; border: none; color: #fff; font-size: 18px; cursor: pointer; }

.modal-body { padding: 20px; font-size: 14px; }
.summary-section, .preview-section { margin-bottom: 16px; }
.summary-section h4, .preview-section h4 { border-left: 4px solid #2e7d32; padding-left: 8px; margin-bottom: 8px; font-size: 14px; }
.grid-summary { display: grid; grid-template-columns: 120px 1fr; gap: 8px; background: #f1f5f9; padding: 12px; border-radius: 4px; }
.highlight { color: #c2410c; font-weight: bold; }

.mail-field { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
.mail-content-box { margin-top: 8px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; height: 120px; overflow-y: auto; background: #fff; }
.warn-text { font-size: 12px; color: #b91c1c; background: #fef2f2; padding: 8px; border-radius: 4px; text-align: center; }

.confirm-message { font-size: 16px; font-weight: 500; text-align: center; margin: 16px 0; }

.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
.justify-center { justify-content: center; border-top: none; background: transparent; }
.btn-cancel { padding: 8px 16px; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; }
.btn-confirm { padding: 8px 16px; background: #2e7d32; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.btn-confirm-action { padding: 8px 24px; background: #2e7d32; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
.text-center { text-center: center; }
</style>