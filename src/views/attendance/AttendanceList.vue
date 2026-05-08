<template>
  <div class="attendance-list-page">

    <!-- ── View 1: 강의 목록 ─────────────────────────────────── -->
    <template v-if="!selectedLecture">
      <h2 class="page-title">출석 현황</h2>

      <div v-if="isLectureLoading" class="hint">강의 목록을 불러오는 중...</div>
      <div v-else-if="lectures.length === 0" class="hint">담당 강의가 없습니다.</div>

      <div v-else class="lecture-list">
        <div
          v-for="lec in lectures"
          :key="lec.lectureId"
          class="lecture-card"
          @click="openRoster(lec)"
        >
          <div class="card-header">
            <span class="type-badge">{{ lec.lectureType }}</span>
            <span class="lecture-name">{{ lec.lectureName }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">학년도/학기</span>
              <span class="value">{{ lec.year }}년 {{ lec.semester }}학기</span>
            </div>
            <div class="info-row">
              <span class="label">학점 / 대상학년</span>
              <span class="value">{{ lec.credit }}학점 / {{ lec.academicYear }}학년</span>
            </div>
            <div v-for="(sch, i) in lec.schedules" :key="i" class="info-row">
              <span class="label">{{ i === 0 ? '강의실' : '' }}</span>
              <span class="value">
                {{ sch.dayOfWeek }}요일 {{ sch.startPeriod }}-{{ sch.endPeriod }}교시 · {{ sch.lectureRoom }}
              </span>
            </div>
          </div>
          <div class="card-footer-hint">클릭하여 출석부 조회 →</div>
        </div>
      </div>
    </template>

    <!-- ── View 2: 출석부 ─────────────────────────────────────── -->
    <template v-else>
      <!-- 헤더 -->
      <div class="roster-header">
        <button class="back-btn" @click="selectedLecture = null">← 강의 목록</button>
        <div class="lecture-title">
          <span class="type-badge">{{ selectedLecture.lectureType }}</span>
          <h2>{{ selectedLecture.lectureName }}</h2>
        </div>
      </div>

      <!-- 날짜 필터 -->
      <div class="date-bar">
        <label class="date-label">수업 날짜</label>
        <input type="date" v-model="selectedDate" class="date-input" @change="applyDateFilter" />
        <span v-if="filteredSession" class="session-type-badge">{{ filteredSession.sessionType }}</span>
        <span v-if="filteredSession?.isActive" class="live-dot" title="진행 중"></span>
        <span v-if="!filteredSession && !isSessionLoading" class="no-session-msg">
          선택한 날짜에 출석 기록이 없습니다.
        </span>
      </div>

      <!-- 출석부 테이블 -->
      <div class="roster-wrap">
        <div v-if="isRosterLoading" class="hint">출석부 로딩 중...</div>
        <div v-else-if="!filteredSession" class="hint">
          날짜를 변경하거나, 먼저 QR 출석을 진행해주세요.
        </div>
        <div v-else-if="roster.length === 0" class="hint">출석 기록이 없습니다.</div>
        <table v-else class="roster-table">
          <thead>
            <tr>
              <th>학년</th>
              <th>이름</th>
              <th>출석 상태</th>
              <th>비고</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in roster" :key="row.attendId">
              <td>{{ row.academicYear != null ? row.academicYear + '학년' : '-' }}</td>
              <td>{{ row.studentName }}</td>
              <td>
                <span :class="['status-badge', statusClass(row.status)]">{{ row.status }}</span>
              </td>
              <td class="reason-cell">{{ row.reason ?? '-' }}</td>
              <td>
                <template v-if="editId !== null && editId === row.attendId">
                  <select v-model="editStatus" class="status-select">
                    <option value="ATTEND">출석</option>
                    <option value="ABSENT">결석</option>
                    <option value="LATE">지각</option>
                    <option value="EARLY_LEAVE">조퇴</option>
                  </select>
                  <input v-model="editReason" class="reason-input" placeholder="사유 (선택)" />
                  <button class="btn btn-save" :disabled="isSaving" @click="saveEdit(row)">저장</button>
                  <button class="btn btn-cancel" @click="cancelEdit">취소</button>
                </template>
                <button v-else-if="row.attendId !== null" class="btn btn-edit" @click="startEdit(row)">수정</button>
                <span v-else class="unprocessed-hint">미처리</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import attendanceService from '@/services/attendanceService.js'

// ── 강의 목록 ──────────────────────────────────────────────────
const lectures = ref([])
const isLectureLoading = ref(true)
const selectedLecture = ref(null)

// ── 세션 / 날짜 필터 ───────────────────────────────────────────
const sessions = ref([])
const isSessionLoading = ref(false)
const selectedDate = ref(today())
const filteredSession = ref(null)

// ── 출석부 ────────────────────────────────────────────────────
const roster = ref([])
const isRosterLoading = ref(false)

// ── 수정 상태 ─────────────────────────────────────────────────
const editId = ref(null)
const editStatus = ref('')
const editReason = ref('')
const isSaving = ref(false)

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } finally {
    isLectureLoading.value = false
  }
})

async function openRoster(lec) {
  selectedLecture.value = lec
  selectedDate.value = today()
  editId.value = null
  roster.value = []
  isSessionLoading.value = true
  try {
    const res = await attendanceService.getSessionList(lec.lectureId)
    sessions.value = res.data ?? res
    applyDateFilter()
  } finally {
    isSessionLoading.value = false
  }
}

async function applyDateFilter() {
  // 선택한 날짜와 일치하는 세션 찾기, 없으면 null
  const session = sessions.value.find(s => s.classDate === selectedDate.value) ?? null
  filteredSession.value = session
  roster.value = []
  editId.value = null

  if (!session) return

  isRosterLoading.value = true
  try {
    const res = await attendanceService.getRoster(selectedLecture.value.lectureId, session.sessionId)
    roster.value = res.data ?? res
  } finally {
    isRosterLoading.value = false
  }
}

// ── 수정 ──────────────────────────────────────────────────────
function startEdit(row) {
  editId.value = row.attendId
  editStatus.value = statusCode(row.status)
  editReason.value = row.reason ?? ''
}

function cancelEdit() { editId.value = null }

async function saveEdit(row) {
  isSaving.value = true
  try {
    await attendanceService.updateAttendStatus(
      selectedLecture.value.lectureId,
      row.attendId,
      editStatus.value,
      editReason.value || null,
    )
    row.status = statusLabel(editStatus.value)
    row.reason = editReason.value || null
    editId.value = null
  } finally {
    isSaving.value = false
  }
}

// ── 유틸 ──────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10)
}

function statusCode(label) {
  return { '출석': 'ATTEND', '결석': 'ABSENT', '지각': 'LATE', '조퇴': 'EARLY_LEAVE' }[label] ?? label
}

function statusLabel(code) {
  return { ATTEND: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴' }[code] ?? code
}

function statusClass(label) {
  return { '출석': 'attend', '결석': 'absent', '지각': 'late', '조퇴': 'early-leave', '미처리': 'unprocessed' }[label] ?? ''
}
</script>

<style scoped lang="scss">
.attendance-list-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 28px 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin-bottom: 24px;
}

.hint {
  text-align: center;
  padding: 48px 0;
  color: #aaa;
  font-size: 14px;
}

/* ── 강의 카드 ── */
.lecture-list { display: flex; flex-direction: column; gap: 14px; }

.lecture-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  &:hover { border-color: #4a7cf7; box-shadow: 0 4px 16px rgba(74,124,247,.12); }
}

.card-header {
  background: #f0f4ff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #dde5ff;
}

.type-badge {
  background: #4a7cf7;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.lecture-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }

.card-body {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.info-row { display: flex; gap: 12px; align-items: baseline; }
.label { width: 90px; font-size: 12px; color: #999; flex-shrink: 0; }
.value { font-size: 14px; color: #333; }

.card-footer-hint {
  padding: 10px 20px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #4a7cf7;
  text-align: right;
}

/* ── 출석부 헤더 ── */
.roster-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #555;
  white-space: nowrap;
  &:hover { background: #f5f5f5; }
}

.lecture-title {
  display: flex;
  align-items: center;
  gap: 10px;
  h2 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0; }
}

/* ── 날짜 필터 ── */
.date-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-label { font-size: 13px; color: #555; font-weight: 600; }

.date-input {
  padding: 7px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  &:focus { outline: none; border-color: #4a7cf7; }
}

.session-type-badge {
  background: #e8f0fe;
  color: #4a7cf7;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
}

.live-dot {
  width: 8px; height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
  animation: pulse 1.2s infinite;
}

.no-session-msg { font-size: 13px; color: #f57c00; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ── 출석부 테이블 ── */
.roster-wrap { overflow-x: auto; }

.roster-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #f0f0f0; }
  th { background: #f8f9ff; font-weight: 600; color: #555; font-size: 12px; }
  tr:hover td { background: #fafbff; }
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  &.attend       { background: #e6f9ee; color: #2e7d32; }
  &.absent       { background: #fdecea; color: #c62828; }
  &.late         { background: #fff8e1; color: #f57f17; }
  &.early-leave  { background: #fff3e0; color: #e65100; }
  &.unprocessed  { background: #f5f5f5; color: #aaa; }
}

.reason-cell { color: #888; font-size: 13px; }

.unprocessed-hint { font-size: 12px; color: #bbb; }

.status-select {
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  margin-right: 6px;
}

.reason-input {
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  width: 110px;
  margin-right: 6px;
}

.btn {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 4px;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.btn-edit   { background: #f0f0f0; color: #555; &:hover { background: #e0e0e0; } }
  &.btn-save   { background: #4a7cf7; color: #fff; &:hover { opacity: 0.85; } }
  &.btn-cancel { background: #fff; border: 1px solid #ddd; color: #777; }
}
</style>