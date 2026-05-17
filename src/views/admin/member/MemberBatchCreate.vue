<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import MemberService from '@/services/memberService'
import MemberCreateTabNav from '@/components/member/MemberCreateTabNav.vue'
import codeListService from '@/services/codeService'
import { useModalStore } from '@/stores/modal'

const router = useRouter()
const modal = useModalStore()

// ── 역할 선택 ──────────────────────────────────
const memberRoles = ref([])
const selectedRole = ref('STUDENT')

const roleLabel = computed(() => {
  const found = memberRoles.value.find(r => r.code === selectedRole.value)
  return found?.value ?? ''
})

// ── 역할별 테이블 컬럼 정의 ───────────
const columnMap = {
  STUDENT: {
    labels: ['이메일', '이름', '생년월일', '전화번호', '비상연락처', '우편번호', '주소', '상세주소', '입학일', '학과명', '편입', '다자녀', '보훈'],
    keys:   ['email', 'name', 'birth', 'tel', 'emergencyTel', 'postcode', 'address', 'detailAddress', 'entryDate', 'majorName', 'isTransfer', 'isMultiChild', 'isVeteran'],
    headerMap: {
      '이메일*':               'email',
      '이름*':                 'name',
      '생년월일*(YYYY-MM-DD)': 'birth',
      '전화번호*':             'tel',
      '비상연락처':            'emergencyTel',
      '우편번호':              'postcode',
      '주소':                  'address',
      '상세주소':              'detailAddress',
      '입학일*(YYYY-MM-DD)':   'entryDate',
      '학과명*':               'majorName',
      '학년*':                 'academicYear',
      '학기*':                 'semester',
      '편입여부(Y)':   'isTransfer',
      '다자녀여부(Y)': 'isMultiChild',
      '보훈여부(Y)':   'isVeteran',
    },
  },
  PROFESSOR: {
    labels: ['이름', '생년월일', '전화번호', '이메일', '학과', '학위', '직위', '상태'],
    keys:   ['name', 'birth', 'tel', 'email', 'majorName', 'degree', 'position', 'status'],
    headerMap: {
      '이름*':                 'name',
      '생년월일*(YYYY-MM-DD)': 'birth',
      '전화번호*':             'tel',
      '이메일*':               'email',
      '학과명':                'majorName',
      '학위':                  'degree',
      '직위':                  'position',
      '상태코드':              'status',
    },
  },
  ADMIN: {
    labels: ['이름', '생년월일', '전화번호', '이메일', '상태'],
    keys:   ['name', 'birth', 'tel', 'email', 'status'],
    headerMap: {
      '이름*':                 'name',
      '생년월일*(YYYY-MM-DD)': 'birth',
      '전화번호*':             'tel',
      '이메일*':               'email',
      '상태코드':              'status',
    },
  },
}

const tableColumns    = computed(() => columnMap[selectedRole.value].labels)
const tableColumnKeys = computed(() => columnMap[selectedRole.value].keys)

// 파일 업로드 상태───────────────────────────────
const fileInputRef = ref(null)
const uploadedFile = ref(null)
const isDragOver   = ref(false)

// 미리보기 데이터 (엑셀 파싱 결과)
const previewRows  = ref([])

const totalRows = computed(() => previewRows.value.length)
const errorRows = computed(() => previewRows.value.filter(r => r.hasError).length)
const errorSummary = computed(() => errorRows.value > 0)
const hasFailReasons = computed(() => previewRows.value.some(r => r.failReason))
const hasSampleRows  = computed(() => previewRows.value.some(r => r.isSample))
const failedRowList = computed(() =>
  previewRows.value
    .map((row, i) => ({ rowNum: i + 1, reason: row.failReason }))
    .filter(r => r.reason)
)

const errorMessage = ref('')
const isLoading    = ref(false)

const DATE_FIELDS = new Set(['birth', 'entryDate', 'exitDate'])

function excelValToStr(val, engKey) {
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  if (DATE_FIELDS.has(engKey) && val !== '' && !isNaN(Number(val))) {
    // Excel 날짜 시리얼(숫자) → YYYY-MM-DD
    const date = new Date(Math.round((Number(val) - 25569) * 86400 * 1000))
    return date.toISOString().slice(0, 10)
  }
  return val
}

// ── 역할 변경 시 파일 초기화 ───────────────────
function handleRoleChange() {
  handleFileReset()
}

// ── 템플릿 다운로드 ───────────────────────────
const downloadMap = {
  STUDENT:   { fn: () => MemberService.downloadStudentBatchTemplate(),   filename: 'student_template.xlsx' },
  PROFESSOR: { fn: () => MemberService.downloadProfessorBatchTemplate(), filename: 'professor_template.xlsx' },
  ADMIN:     { fn: () => MemberService.downloadAdminBatchTemplate(),      filename: 'admin_template.xlsx' },
}
const batchRegisterMap = {
  STUDENT:   (formData) => MemberService.batchRegisterStudents(formData),
  PROFESSOR: (formData) => MemberService.batchRegisterProfessors(formData),
  ADMIN:     (formData) => MemberService.batchRegisterAdmins(formData),
}
async function handleDownloadTemplate() {
  try {
    const { fn, filename } = downloadMap[selectedRole.value]
    const blob = await fn()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    errorMessage.value = '템플릿 다운로드에 실패했습니다.'
  }
}

// ── 파일 선택 트리거 ─────────────────────────
function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleDrop(event) {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  processFile(file)
}

function handleFileChange(event) {
  const file = event.target.files[0]
  processFile(file)
}

// ── 파일 유효성 검사 + 미리보기 파싱 ────────────
async function processFile(file) {
  if (!file) return
  errorMessage.value = ''

  // .xlsx만 허용
  if (!file.name.endsWith('.xlsx')) {
    errorMessage.value = '.xlsx 파일만 업로드 가능합니다.'
    return
  }
  // 5MB 제한
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = '파일 크기는 5MB 이하여야 합니다.'
    return
  }

  uploadedFile.value = file

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' })

  const headerMap = columnMap[selectedRole.value].headerMap
  previewRows.value = jsonData.map(row => {
    const mapped = {}
    Object.entries(headerMap).forEach(([korKey, engKey]) => {
      mapped[engKey] = excelValToStr(row[korKey] ?? '', engKey)
    })
    const EMAIL_RE = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    const TEL_RE   = /^0\d{9,10}$/

    const errors = []
    if (!mapped.email) errors.push('이메일 필수')
    else if (!EMAIL_RE.test(mapped.email)) errors.push('이메일 형식 오류')
    if (!mapped.name) errors.push('이름 필수')
    if (!mapped.birth) errors.push('생년월일 필수')
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(mapped.birth)) errors.push('생년월일 형식 오류 (YYYY-MM-DD)')
    if (!mapped.tel) errors.push('전화번호 필수')
    else if (!TEL_RE.test(mapped.tel)) errors.push('전화번호 형식 오류 (숫자 10~11자리)')
    if (mapped.emergencyTel && !TEL_RE.test(mapped.emergencyTel)) errors.push('비상연락처 형식 오류 (숫자 10~11자리)')
    if (!mapped.entryDate) errors.push('입학일 필수')
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(mapped.entryDate)) errors.push('입학일 형식 오류 (YYYY-MM-DD)')
    if (!mapped.majorName) errors.push('학과명 필수')

    mapped.isSample = mapped.email === '__sample__@example.com'
    mapped.hasError = errors.length > 0
    mapped.failReason = errors.join(' · ')
    return mapped
  })
}

function handleFileReset() {
  uploadedFile.value = null
  previewRows.value  = []
  errorMessage.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleSubmit() {
  if (!uploadedFile.value) return
  errorMessage.value = ''
  isLoading.value = true

  // 파싱된 데이터로 Excel 재생성 (날짜 시리얼 → 문자열 변환)
  const { headerMap } = columnMap[selectedRole.value]
  const korHeaders = Object.keys(headerMap)
  const engKeys = Object.values(headerMap)
  const wsData = [
    korHeaders,
    ...previewRows.value.map(row => engKeys.map(k => String(row[k] ?? '')))
  ]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  const formData = new FormData()
  formData.append('file', blob, uploadedFile.value.name)

  try {
    const res = await batchRegisterMap[selectedRole.value](formData)
    const result = res.data
    if (result?.failCount > 0) {
      result.failList?.forEach(item => {
        const row = previewRows.value[item.row - 2] 
        if (row) {
          row.hasError = true
          row.failReason = item.reason ?? '등록 실패'
        }
      })
      errorMessage.value = `검증 실패 ${result.failCount}건. 아래 오류 내용을 확인하고 수정 후 재업로드해주세요.`
    } else {
      await modal.showAlert(`${result?.successCount}명 등록 완료되었습니다.`, 'success')
      handleFileReset()
    }
  } catch (error) {
    errorMessage.value = error?.message ?? '등록 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const [ roles ] = await Promise.all([codeListService.getMemberRole()])
  memberRoles.value = roles.data
})
</script>

<template>
  <MemberCreateTabNav activeTab="batch" />
  <div class="form-wrap">
    <div class="input-content radio-group radio-tab">
      <label class="radio-label" v-for="memberRole in memberRoles" :key="memberRole.code">
        <input type="radio" name="memberRole" :value="memberRole.code" v-model="selectedRole" @change="handleRoleChange" />
        <span>{{ memberRole.value }}</span>
      </label>
    </div>

    <div class="content-wrap">
      <h3><font-awesome-icon icon="fa-solid fa-file-excel" /> {{ roleLabel }} 엑셀 양식 다운로드</h3>
      <div class="template-download-row">
        <span class="template-hint">{{ roleLabel }} 데이터 입력용 엑셀 양식을 다운로드하세요.</span>
        <button class="btn btn-default" @click="handleDownloadTemplate">
          <font-awesome-icon icon="fa-solid fa-download" /> {{ roleLabel }} 엑셀 양식 다운로드
        </button>
      </div>
    </div>

    <div class="content-wrap">
      <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> {{ roleLabel }} 엑셀 파일 업로드</h3>

      <div v-if="!uploadedFile"
        class="dropzone"
        :class="{ 'dropzone--over': isDragOver }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <p class="dropzone__text">데이터가 입력된 엑셀 파일을 업로드 해주세요.</p>
        <button type="button" class="btn btn-default" @click.stop="triggerFileInput">
          <font-awesome-icon icon="fa-solid fa-upload" /> 파일 선택
        </button>
        <input ref="fileInputRef" type="file" accept=".xlsx" class="hidden-input" @change="handleFileChange" />
      </div>

      <div v-else class="preview-section">
        <div class="preview-header">
          <span class="preview-filename">
            <font-awesome-icon icon="fa-solid fa-file-excel" /> {{ uploadedFile.name }}
            <span class="preview-count">{{ totalRows }}건</span>
          </span>
          <button class="btn btn-default btn-sm" @click="handleFileReset">다시 선택</button>
        </div>

        <div v-if="totalRows === 0" class="no-data-warning">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
          <div>
            <p>인식된 데이터가 없습니다.</p>
            <p>엑셀 1행의 헤더가 양식과 일치하는지 확인하고 다시 업로드해주세요.</p>
          </div>
        </div>

        <template v-else>
          <div v-if="hasSampleRows" class="sample-warning">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
            <div>
              <p>샘플 데이터 행이 포함되어 있습니다.</p>
              <p>노란색으로 표시된 샘플 행을 삭제한 후 재업로드해주세요.</p>
            </div>
          </div>

          <p v-if="errorSummary" class="error-summary">
            <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
            오류 {{ errorRows }}건 — 오류 행을 수정한 후 다시 업로드해주세요.
          </p>

          <div class="table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th class="col-row-num">행</th>
                  <th v-for="col in tableColumns" :key="col">{{ col }}</th>
                  <th v-if="hasFailReasons" class="col-error-reason">오류 사유</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in previewRows"
                  :key="index"
                  :class="{ 'row--error': row.hasError, 'row--sample': row.isSample }"
                >
                  <td class="col-row-num">{{ index + 1 }}</td>
                  <td v-for="col in tableColumnKeys" :key="col">{{ row[col] ?? '' }}</td>
                  <td v-if="hasFailReasons" class="col-error-reason">{{ row.failReason ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <div v-if="failedRowList.length > 0" class="fail-list">
        <p class="fail-list__title">
          <font-awesome-icon icon="fa-solid fa-triangle-exclamation" /> 등록 실패 사유
        </p>
        <ul>
          <li v-for="item in failedRowList" :key="item.rowNum">
            <span class="fail-row-num">{{ item.rowNum }}행</span> {{ item.reason }}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="btn-row g10">
    <div class="submit-wrap">
      <button
        class="btn btn-submit"
        :disabled="!uploadedFile || isLoading || errorSummary || hasSampleRows || totalRows === 0"
        @click="handleSubmit"
      >
        <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isLoading ? '등록 중...' : '등록' }}
      </button>
      <!-- <p v-if="hasSampleRows" class="submit-disabled-hint">
        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
        샘플 행을 삭제한 후 재업로드해주세요.
      </p>
      <p v-else-if="errorSummary" class="submit-disabled-hint">
        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
        데이터 오류가 있습니다. 파일을 수정 후 다시 업로드해주세요.
      </p> -->
    </div>
  </div>
</template>



<style scoped lang="scss">
// ───── 템플릿 다운로드 ─────
.template-download-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 4px;
}

.template-hint {
  font-size: 14px;
  color: var(--color-text-muted);
}

// ───── 드롭존 ─────
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 180px;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;

  &--over {
    border-color: var(--color-primary);
    background-color: var(--color-bg);
  }
}

.dropzone__text {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.hidden-input {
  display: none;
}

// ───── 미리보기 ─────
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-filename {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-count {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-muted);
}

.error-summary {
  font-size: 13px;
  color: #d32f2f;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sample-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  background: #fefce8;
  color: #92400e;
  font-size: 14px;
  margin-bottom: 4px;

  svg { margin-top: 2px; flex-shrink: 0; }
  p { margin: 0; }
  p:first-child { font-weight: 600; }
  p:last-child  { font-size: 13px; margin-top: 4px; }
}

.no-data-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #f5c25c;
  border-radius: 6px;
  background: #fffbf0;
  color: #b45309;
  font-size: 14px;

  svg {
    margin-top: 2px;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    &:first-child { font-weight: 600; }
    &:last-child { font-size: 13px; margin-top: 4px; color: #92400e; }
  }
}

.error-message {
  font-size: 13px;
  color: #d32f2f;
  margin: 8px 0 0;
}

.fail-list {
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid #f5c2c2;
  border-radius: 6px;
  background: #fff8f8;

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #d32f2f;
    margin: 0 0 8px;
  }

  ul {
    margin: 0;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li {
    font-size: 13px;
    color: var(--color-text);
  }
}

.fail-row-num {
  font-weight: 600;
  color: #d32f2f;
  margin-right: 6px;
}

// ───── 테이블 ─────
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 800px;

  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    white-space: nowrap;
  }

  th {
    background-color: var(--color-bg);
    font-weight: 600;
    color: var(--color-text);
  }

  .col-row-num {
    width: 48px;
    min-width: 48px;
    text-align: center;
    color: var(--color-text-muted);
    font-weight: 400;
  }

  tr.row--error td {
    background-color: #fde8e8;
  }

  tr.row--sample td {
    background-color: #fefce8;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .col-error-reason {
    color: #d32f2f;
    min-width: 160px;
  }

  .empty-cell {
    text-align: center;
    color: var(--color-text-muted);
    padding: 32px;
  }
}

.submit-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.submit-disabled-hint {
  font-size: 12px;
  color: #d32f2f;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-sm {
  height: 32px;
  font-size: 13px;
  padding: 0 12px;
}
</style>