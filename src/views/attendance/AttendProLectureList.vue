<template>
  <div class="prof-lecture-page">

    <!-- [수정] 카드 레이아웃 → DataTable 컴포넌트로 교체 -->
    <div class="filter-header">
      <h2 class="page-title">내 강의 목록</h2>
    </div>

    <DataTable
      :columns="['강의명', '유형', '학년도 / 학기', '학점 / 대상학년', '강의실', '관리']"
      :rows="lectures"
      gridCols="minmax(160px,2fr) minmax(80px,1fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(200px,2.5fr) minmax(170px,1.4fr)"
      :isLoading="isLoading"
      emptyMessage="담당 중인 강의가 없습니다."
    >
      <article
        v-for="lecture in lectures"
        :key="lecture.lectureId"
        class="tbl-row"
      >
        <div>{{ lecture.lectureName }}</div>
        <div><span class="type-badge">{{ lecture.lectureType }}</span></div>
        <div>{{ lecture.year }}년 {{ lecture.semester }}학기</div>
        <div>{{ lecture.credit }}학점 / {{ lecture.academicYear }}학년</div>
        <div class="schedule-cell">
          <span v-for="(sch, i) in lecture.schedules" :key="i" class="schedule-item">
            {{ sch.dayOfWeek }}요일 {{ sch.startPeriod }}-{{ sch.endPeriod }}교시 · {{ sch.lectureRoom }}
          </span>
        </div>
        <div class="action-cell">
          <button class="btn btn-line" @click.stop="$router.push('/attendances/roster')">출석 현황</button>
          <button class="btn btn-submit" @click.stop="$router.push(`/attendances/${lecture.lectureId}/qr`)">QR 출석</button>
        </div>
      </article>
    </DataTable>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/common/DataTable.vue'
import attendanceService from '@/services/attendanceService.js'

const lectures = ref([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const res = await attendanceService.getProfessorLectures()
    lectures.value = res.data ?? res
  } catch {
    // 에러 모달은 httpRequester 인터셉터가 처리
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss">
.prof-lecture-page {
  width: 100%;
  padding: 28px var(--size-df);
  overflow-x: auto;
}

.page-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--font-color);
}

/* 강의 유형 뱃지 — position: static으로 전역 .tbl-wrap .status-badge 절대위치 규칙 차단 */
.type-badge {
  position: static;
  display: inline-block;
  background: var(--main-color);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

/* 강의실 셀 — 복수 스케줄을 줄바꿈으로 표시하되 각 줄은 nowrap */
.schedule-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
}

.schedule-item {
  font-size: var(--text-sm);
  color: var(--font-color);
  white-space: nowrap;
}

/* 관리 버튼 셀 — 버튼 줄바꿈 방지 */
.action-cell {
  display: flex;
  gap: 6px;
  justify-content: center;
  white-space: nowrap;
}

.btn {
  font-size: var(--text-xs);
  padding: 6px 14px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-submit {
  background: var(--main-color);
  color: #fff;
  border: 1px solid var(--main-color);
  &:hover { filter: brightness(1.1); }
}

.btn-line {
  background: #fff;
  color: var(--font-color);
  border: 1px solid var(--line-color);
  &:hover { border-color: var(--main-color); color: var(--main-color); }
}

/* DataTable 슬롯 .tbl-row — 컴포넌트 scoped CSS가 slot 내부 div에 미적용되므로 직접 정의 */
.tbl-row {
  display: grid;
  grid-template-columns: var(--grid-cols);
  align-items: stretch;
  background: #fff;
  border: 1px solid var(--table-border-color);
  border-top-width: 0;

  &:nth-of-type(2) { border-radius: 5px 5px 0 0; border-width: 1px; }
  &:last-child     { border-radius: 0 0 5px 5px; }

  > div {
    padding: 12px 10px;
    line-height: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.schedule-cell { justify-content: flex-start !important; flex-direction: column; }
.action-cell   { justify-content: center; gap: 6px; }
</style>