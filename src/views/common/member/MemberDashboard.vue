<script setup>
import TimetableWidget from '@/components/dashboard/TimetableWidget.vue'
import ActiveScheduleBanner from '@/components/dashboard/ActiveScheduleBanner.vue'
import MonthlyScheduleWidget from '@/components/dashboard/MonthlyScheduleWidget.vue'
import TodayLectureWidget from '@/components/dashboard/TodayLectureWidget.vue'
import TuitionStatus from '@/components/dashboard/TuitionStatus.vue'
import StudentRequestsWidget from '@/components/dashboard/StudentRequestsWidget.vue'
import AnnouncementWidget from '@/components/dashboard/AnnouncementWidget.vue'
import PendingLecturesWidget from '@/components/dashboard/PendingLecturesWidget.vue'
import PendingMajorRequestsWidget from '@/components/dashboard/PendingMajorRequestsWidget.vue'
import PendingStatusRequestsWidget from '@/components/dashboard/PendingStatusRequestsWidget.vue'
import MemberCountsWidget from '@/components/dashboard/MemberCountsWidget.vue'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authentication'
import memberService from '@/services/memberService'
import { POSITION_LABEL } from '@/utils/constants.js'

const authStore = useAuthStore()

const profile = ref(null)

// 현재 날짜 기준 학기 계산 (9월 이후 → 2학기)
const currentTerm = computed(() => {
  const now = new Date()
  const semester = now.getMonth() + 1 >= 9 ? 2 : 1
  return `${now.getFullYear()}-${semester}학기`
})

onMounted(async () => {
  try {
    const res = await memberService.findProfile()
    profile.value = res.data
  } catch (e) {
    console.error('프로필 조회 실패', e)
  }
})
</script>

<template>
  <div class="dashboard">

    <!-- ───── 학생 ───── -->
    <template v-if="authStore.role === 'STUDENT'">
      <header class="dash-head">
        <div class="dash-greeting">
          <p class="dash-title">안녕하세요, <strong>{{ authStore.name }}</strong> 학생님</p>
          <p class="dash-sub">
            {{ currentTerm }}
            <template v-if="profile">
              · {{ profile.mainMajorName }} · {{ profile.academicYear }}학년
              <template v-if="profile.subMajorName"> · 부전공 {{ profile.subMajorName }}</template>
            </template>
          </p>
        </div>
        <div class="dash-banner">
          <ActiveScheduleBanner />
        </div>
      </header>
      <div class="role-grid">
        <div class="timetable-col">
          <TimetableWidget />
        </div>
        <div class="role-side">
          <div class="content-wrap"><AnnouncementWidget /></div>
          <div class="content-wrap"><MonthlyScheduleWidget /></div>
          <div class="content-wrap"><StudentRequestsWidget /></div>
        </div>
      </div>
    </template>

    <!-- ───── 교수 ───── -->
    <template v-else-if="authStore.role === 'PROFESSOR'">
      <header class="dash-head">
        <div class="dash-greeting">
          <p class="dash-title">안녕하세요, <strong>{{ authStore.name }}</strong> 교수님</p>
          <p class="dash-sub">
            {{ currentTerm }}
            <template v-if="profile">
              · {{ profile.majorName }}
              <template v-if="profile.position"> · {{ POSITION_LABEL[profile.position] }}</template>
            </template>
          </p>
        </div>
        <div class="dash-banner">
          <ActiveScheduleBanner />
        </div>
      </header>
      <div class="role-grid">
        <div class="timetable-col">
          <TimetableWidget />
        </div>
        <div class="role-side">
          <div class="content-wrap"><TodayLectureWidget /></div>
          <div class="content-wrap"><AnnouncementWidget /></div>
          <div class="content-wrap"><MonthlyScheduleWidget /></div>
        </div>
      </div>
    </template>

    <!-- ───── 관리자 ───── -->
    <template v-else-if="authStore.role === 'ADMIN'">
      <header class="dash-head">
        <div class="dash-greeting">
          <p class="dash-title">안녕하세요, <strong>{{ authStore.name }}</strong> 관리자님</p>
          <p class="dash-sub">{{ currentTerm }}</p>
        </div>
        <div class="dash-banner">
          <ActiveScheduleBanner />
        </div>
      </header>
      <div class="admin-outer">
        <div class="admin-main">
          <div class="admin-pending">
            <div class="content-wrap"><PendingLecturesWidget /></div>
            <div class="content-wrap"><PendingMajorRequestsWidget /></div>
            <div class="content-wrap"><PendingStatusRequestsWidget /></div>
          </div>
          <div class="admin-info">
            <MemberCountsWidget />
            <div class="content-wrap"><TuitionStatus /></div>
          </div>
        </div>
        <div class="admin-side">
          <div class="content-wrap"><MonthlyScheduleWidget /></div>
          <div class="content-wrap"><AnnouncementWidget /></div>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped lang="scss">
$gap: 16px;

// ─── 전체 래퍼 ────────────────────────────────────────────
.dashboard {  display: flex;  flex-direction: column;  gap: $gap;  height: 100%;  min-width: 1200px;
  .content-wrap{border: 1px solid $border-color;}
}

// ─── 헤더 (인삿말 + 배너) ─────────────────────────────────
.dash-head {  display: grid;  grid-template-columns: 1fr 2fr; align-items: center;  gap: 24px;  flex-shrink: 0;
    .dash-greeting {  flex-shrink: 0;
        .dash-title {  font-size: $fs-xl;   font-weight: 400;  color: $font-color;
            strong { font-weight: 700; }
        }
        .dash-sub {  font-size: $fs-sm;  color: $font-color-light;  margin-top: 4px;}
    }
    .dash-banner {  flex: 1;  min-width: 0;}
}
// ─── 세로 스택 컬럼 ──────────────────────────────────────
.dash-col { display: flex;  flex-direction: column;  gap: $gap;  height: 100%;}

// ─── 학생/교수 공통 레이아웃 ──────────────────────────────
.role-grid { flex: 1; display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: $gap; min-height: 0; }
.role-side { display: flex; flex-direction: column; gap: $gap;
  > .content-wrap { flex: 1; min-height: 0; overflow-y: auto; padding: $md; }
}

// ─── 관리자 레이아웃 ──────────────────────────────────────
.admin-outer {  flex: 1;  display: grid;  grid-template-columns: minmax(0, 1fr) 260px;  gap: $gap;  min-height: 0; }
.admin-main { display: grid; grid-template-rows: 2fr 1fr; gap: $gap; min-height: 0;
    .admin-pending { display: grid;  grid-template-columns: repeat(3, 1fr); gap: $gap;}
    .admin-info { flex: 1; display: grid; grid-template-columns: 1.2fr 1fr; gap: $gap;  min-height: 0;}
}
.admin-side {  display: grid; grid-template-rows: 1fr 1fr;  gap: $gap;  min-height: 0;
  > .content-wrap { min-height: 0; overflow-y: auto; padding: $md; }
}

// ─── 플레이스홀더 ────────────────────────────────────────
.placeholder-cell {  flex: 1;  min-height: 150px;  background-color: $default-bg !important;  border: 1px dashed $border-color !important;  box-shadow: none !important;}

// ─── timetable height 체인 ────────────────────────────────
.timetable-col { display: flex; flex-direction: column; min-height: 0;     box-shadow: 0 1px 2px rgba(15, 61, 46, 0.06);}
:deep(.timetable-wrap) { width: 100%; flex: 1; min-height: 0; }

// content-wrap 안에서 이중 카드 방지 (border·padding·배경 제거)
:deep(.widget-card),
:deep(.tuition-container) {
  max-width: 100%;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

// ─── 위젯 공통 스타일 ─────────────────────────────────────
// 위젯 헤더 레이아웃
:deep(.widget-header) {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
// 위젯 헤더 타이틀
:deep(.widget-header h3),
:deep(.tuition-header .title) {
  font-size: $fs-df; font-weight: 700; color: $font-color; margin: 0;
}

// 전체보기 링크
:deep(.view-all) {
  font-size: $fs-xs; color: $font-color-light; text-decoration: none;
  &:hover { color: $green-600; }
}

// 빈 상태 메시지
:deep(.empty-msg),
:deep(.timetable-empty) {
  font-size: $fs-sm; color: $font-color-light; text-align: center; padding: 20px 0;
}

// .type-name → .dash-title deep 규칙으로 통합됨

// ─── 위젯 공통 리스트/행 ──────────────
:deep(.dash-list) {
  list-style: none; padding: 0 5px; margin: 0; display: flex; flex-direction: column;
  .pointer { &:hover .dash-title { color: $green-600; } }
}
:deep(.dash-item) {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 0; border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
}
:deep(.dash-title) {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
  font-size: $fs-df; font-weight: 600; color: $font-color; transition: color 0.15s;
}

// ─── 관리자 승인 대기 위젯 공통 (3개 공유) ───────────────────
:deep(.pend-item) { align-items: flex-start; }
:deep(.pend-info) { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
:deep(.pend-sub)  { font-size: $fs-xs; color: $font-color-light; }
:deep(.dash-dot) {
  width: 5px; height: 5px; border-radius: 50%;
  background: $font-color-light; flex-shrink: 0;
}
:deep(.dash-date) {
  font-size: $fs-xs; color: $font-color-light; flex-shrink: 0; white-space: nowrap;
}
:deep(.dash-badge){
font-size: 11px; padding: 2px 5px;
}
</style>
