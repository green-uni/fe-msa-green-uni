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
          <p class="dash-name">안녕하세요, <strong>{{ authStore.name }}</strong> 학생님</p>
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
      <div class="student-grid">
        <div class="content-wrap student-main">
          <TimetableWidget />
        </div>
        <div class="student-side">
          <div class="content-wrap placeholder-cell">이번 학기 출석 현황</div>
          <div class="content-wrap"><StudentRequestsWidget /></div>
          <div class="content-wrap"><AnnouncementWidget /></div>
          <div class="content-wrap"><MonthlyScheduleWidget /></div>
        </div>
      </div>
    </template>

    <!-- ───── 교수 ───── -->
    <template v-else-if="authStore.role === 'PROFESSOR'">
      <header class="dash-head">
        <div class="dash-greeting">
          <p class="dash-name">안녕하세요, <strong>{{ authStore.name }}</strong> 교수님</p>
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
      <div class="professor-grid">
        <div class="content-wrap professor-main">
          <TimetableWidget />
        </div>
        <div class="professor-side">
          <div class="content-wrap"><TodayLectureWidget /></div>
          <div class="content-wrap placeholder-cell">오늘 강의별 출석현황</div>
          <div class="content-wrap"><AnnouncementWidget /></div>
          <div class="content-wrap"><MonthlyScheduleWidget /></div>
        </div>
      </div>
    </template>

    <!-- ───── 관리자 ───── -->
    <template v-else-if="authStore.role === 'ADMIN'">
      <header class="dash-head">
        <div class="dash-greeting">
          <p class="dash-name">안녕하세요, <strong>{{ authStore.name }}</strong> 관리자님</p>
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
.dashboard {  display: flex;  flex-direction: column;  gap: $gap;  height: 100%;}

// ─── 헤더 (인삿말 + 배너) ─────────────────────────────────
.dash-head {  display: grid;  grid-template-columns: 1fr 2fr; align-items: center;  gap: 24px;  flex-shrink: 0;
    .dash-greeting {  flex-shrink: 0;
        .dash-name {  font-size: 1.286em;   font-weight: 400;  color: $font-color;
            strong { font-weight: 700; }
        }
        .dash-sub {  font-size: 0.929em;  color: $font-color-light;  margin-top: 4px;}
    }
    .dash-banner {  flex: 1;  min-width: 0;}
}
// ─── 세로 스택 컬럼 ──────────────────────────────────────
.dash-col { display: flex;  flex-direction: column;  gap: $gap;  height: 100%;}

// ─── 학생 레이아웃 ────────────────────────────────────────
.student-grid {  flex: 1;  display: grid;  grid-template-columns: 1fr 2fr;  gap: $gap;  min-height: 0;}
.student-main { overflow: auto; }
.student-side {  display: grid;  grid-template-columns: 1fr 1fr;  grid-template-rows: 1fr 1fr;  gap: $gap;}

// ─── 교수 레이아웃 ────────────────────────────────────────
.professor-grid {  flex: 1;  display: grid;  grid-template-columns: 1fr 2fr;  gap: $gap;  min-height: 0;}
.professor-main { overflow: auto; }
.professor-side {  display: grid;  grid-template-columns: 1fr 1fr;  grid-template-rows: 1fr 1fr;  gap: $gap;}

// ─── 관리자 레이아웃 ──────────────────────────────────────
.admin-outer {  flex: 1;  display: grid;  grid-template-columns: 2fr 1fr;  gap: $gap;  min-height: 0; }
.admin-main { display: grid; grid-template-rows: 2fr 1fr; gap: $gap;
    .admin-pending { display: grid;  grid-template-columns: repeat(3, 1fr); gap: $gap;}
    .admin-info { flex: 1; display: grid; grid-template-columns: 1.2fr 1fr; gap: $gap;  min-height: 0;}
}
.admin-side {  display: grid; grid-template-rows:  1fr 1fr;  gap: $gap;  height: 100%;
}

// ─── 플레이스홀더 ────────────────────────────────────────
.placeholder-cell {  flex: 1;  min-height: 150px;  background-color: $bg !important;  border: 1px dashed $line !important;  box-shadow: none !important;}

// ─── 컴포넌트 너비·사이즈 제약 해제 ──────────────────────
:deep(.timetable-wrap) { width: 100%; }

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

// ─── 제목 크기 통일 (13px) ────────────────────────────────
:deep(.widget-header h3),
:deep(.tuition-header .title) { 
font-weight: 600; color: $font-color; margin: 0;
}
</style>
