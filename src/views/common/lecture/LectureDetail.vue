<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, reactive, ref, computed } from 'vue';
import LectureService from '@/services/lectureService';
import { useAuthStore } from '@/stores/authentication';
import DataTable from '@/components/common/DataTable.vue';
import { useModalStore } from '@/stores/modal';
import Pagination from '@/components/common/Pagination.vue';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();
const authStore = useAuthStore();

// 재직중인 교수만 출석 및 성적 수정버튼 보이게 함
const canEdit = computed(() =>
  authStore.role === 'PROFESSOR' && authStore.profStatus === 'employment'
);

// 강의를 보는 사람이 그 강의를 개설한 교수일때만 수강학생이 노출
const isMyLecture = computed(() =>
  authStore.role === 'PROFESSOR' && state.data.memberCode === authStore.memberCode
);

const activeTab = ref('detail');

const state = reactive({
  data: {
    memberCode: 0,
    status: '',
    proName: '',
    lectureName: '',
    lectureId: '',
    majorId: 0,
    majorName: '',
    year: '',
    semester: 0,
    lectureType: '',
    credit: 0,
    maxStd: 0,
    academicYear: 0,
    refBooks: '',
    goal: '',
    weeklyPlan: '',
    startDate: null,
    endDate: null,
    schedules: [],
    rejectionReason: '',
    rejectionAt: null,
  },
  studentList: []
});

// 페이징 처리
const currentPage = ref(1);
const pageSize = 5;

const pagedStudentList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return state.studentList.slice(start, start + pageSize);
});

const maxPageStudent = computed(() =>
  Math.ceil(state.studentList.length / pageSize) || 1
);

const goToPage = (page) => {
  currentPage.value = page;
};

const id = route.params.lectureId;

// 관리자 승인/반려 버튼 노출 조건
const canApprove = computed(() =>
  authStore.role === 'ADMIN' &&
  (state.data.status === '대기' || state.data.status === '반려')
);
const canReject = computed(() =>
  authStore.role === 'ADMIN' && state.data.status === '대기'
);

// 반려사유 입력박스
const showRejectionBox = ref(false);
const rejectionInput = ref('');

// 승인
const updateStatus = async (newStatus) => {
  const isConfirmed = await modal.showConfirm('이 강의를 승인하시겠습니까?', 'success');
  if (!isConfirmed) return;

  try {
    await LectureService.updateLectureStatus(id, { status: newStatus });
    state.data.status = '승인';
  } catch (error) {
    console.error('승인 실패:', error);
  }
};

// 반려 버튼 클릭 → textarea 노출
const openRejectionBox = () => {
  showRejectionBox.value = true;
  rejectionInput.value = '';
};

// 반려 사유 등록 → confirm → API
const submitRejection = async () => {
  if (!rejectionInput.value.trim()) {
    modal.showAlert('반려 사유를 입력해주세요.', 'warning');
    return;
  }

  const isConfirmed = await modal.showConfirm('이 강의를 반려하시겠습니까?', 'warning');
  if (!isConfirmed) return;

  try {
    await LectureService.updateLectureStatus(id, {
      status: 'REJECTED',
      reason: rejectionInput.value
    });
    state.data.status = '반려';
    state.data.rejectionReason = rejectionInput.value;
    showRejectionBox.value = false;
    rejectionInput.value = '';
  } catch (error) {
    console.error('반려 실패:', error);
  }
};

const editLecture = () => {
  router.push(`/lectures/edit/${id}`);
};

// 이전 목록으로 돌아가기
const goBackToList = () => {
  const from = route.query.from;
  if (from === 'ADMIN') {
    const { from, ...restQuery } = route.query;
    router.push({ path: '/admin/lectures', query: restQuery });
  } else if (from === 'ALL') {
    const { from, ...restQuery } = route.query;
    router.push({ path: '/lectures', query: restQuery });
  } else {
    const { from, ...restQuery } = route.query;
    router.push({ path: '/lectures/my', query: restQuery });
  }
};

// 내 강의 삭제
const deleteLecture = async () => {
  const isConfirmed = await modal.showConfirm('강의를 삭제하시겠습니까?', 'warning');
  if (!isConfirmed) return;

  try {
    await LectureService.deleteLecture(id);
    modal.showAlert('강의가 삭제되었습니다.', 'success');
    router.push('/lectures/my');
  } catch (error) {
    const msg = error.response?.data?.result || '삭제에 실패했습니다.';
    modal.showAlert(msg, 'error');
  }
};

onMounted(async () => {
  // 강의 상세
  try {
    const res = await LectureService.getLectureDetail(id);
    state.data = Array.isArray(res) && res.length > 0 ? res[0] : res;

    // 강의 정보 받은 후 탭 설정: 승인된 내 강의면 수강학생목록, 나머지는 강의상세
    activeTab.value = (isMyLecture.value && state.data.status === '승인') ? 'students' : 'detail';
  } catch (error) {
    console.error('강의 상세 로드 실패:', error);
  }

  // 수강 학생 목록 (교수일 때만, API 미완성으로 fetch 사용)
  try {
    if (authStore.role === 'PROFESSOR') {
      const res = await LectureService.getStudentsByLecture(id);
      state.studentList = res.map(student => {
        const countAttendScore = 20;
        const attendScore = Math.max(
          0,
          countAttendScore - (student.lateCount * 1) - (student.absentCount * 3)
        );
        const gradeLetter = attendScore <= 0 ? 'F' : student.gradeLetter;
        return { ...student, gradeLetter };
      });
    }
  } catch (error) {
    console.error('수강 학생 로드 실패:', error);
    state.studentList = [];
  }
});
</script>

<template>
  <div class="container">

    <!-- 헤더 -->
    <div class="page-header">
      <button class="btn btn-default" @click="goBackToList">
        <font-awesome-icon icon="fa-solid fa-list" /> 목록
      </button>

      <!-- 관리자 버튼 -->
      <div class="action-group">
        <button v-if="canApprove" class="btn btn-success" @click="updateStatus('APPROVED')">승인</button>
        <button v-if="canReject && !showRejectionBox" class="btn btn-danger" @click="openRejectionBox">반려</button>
      </div>

      <!-- 교수: 수정/삭제 (반려 상태 + 수강생 없을 때) -->
      <div
        v-if="canEdit && isMyLecture && state.data.status === '반려' && state.studentList.length === 0"
        class="action-group"
      >
        <button class="btn btn-outline" @click="editLecture">
          <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 강의 정보 수정
        </button>
        <button class="btn btn-danger" @click="deleteLecture">
          <font-awesome-icon icon="fa-solid fa-trash" /> 강의 삭제
        </button>
      </div>
    </div>

    <!-- 반려사유 입력박스 (관리자) -->
    <div v-if="showRejectionBox" class="rejection-box">
      <textarea
        v-model="rejectionInput"
        class="rejection-textarea"
        placeholder="반려 사유를 입력해주세요."
        rows="3"
      />
      <div class="rejection-actions">
        <button class="btn btn-default" @click="showRejectionBox = false; rejectionInput = ''">취소</button>
        <button class="btn btn-danger" @click="submitRejection">사유 등록</button>
      </div>
    </div>

    <div class="info-container g20">

      <!-- 좌측 강의정보 카드 -->
      <div class="content-wrap info-wrap info-card g20" style="--flex-width:350px;">
        <div class="info-title">
          <h2>{{ state.data.lectureName }}</h2>
          <div v-if="state.data.status === '대기'">
            <span class="status-badge pending">승인대기</span>
          </div>
          <div v-else-if="state.data.status === '반려'">
            <span class="status-badge rejected">반려</span>
          </div>
          <span class="info-detail">{{ state.data.year }}년 {{ state.data.semester }}학기</span>
        </div>

        <div class="info-list">
          <dl class="info-row">
            <dt>교수명</dt>
            <dd>{{ state.data.proName }}</dd>
          </dl>
          <dl class="info-row">
            <dt>이수구분</dt>
            <dd>{{ state.data.lectureType }}</dd>
          </dl>
          <dl class="info-row">
            <dt>이수학점</dt>
            <dd>{{ state.data.credit }}</dd>
          </dl>
          <dl class="info-row">
            <dt>수강인원</dt>
            <dd>{{ state.studentList.length }} / {{ state.data.maxStd }}</dd>
          </dl>
          <dl class="info-row" v-if="state.data.schedules && state.data.schedules.length > 0">
            <dt>강의실</dt>
            <dd>
              <div v-for="(s, i) in state.data.schedules" :key="i">
                {{ s.building }} {{ s.room }}
              </div>
            </dd>
          </dl>
          <dl class="info-row" v-if="state.data.schedules && state.data.schedules.length > 0">
            <dt>강의시간</dt>
            <dd>
              <div v-for="(s, i) in state.data.schedules" :key="i">
                {{ s.dayOfWeek }}요일 {{ s.startPeriod }}교시 ~ {{ s.endPeriod }}교시
              </div>
            </dd>
          </dl>
        </div>
      </div>

      <!-- 우측 탭 영역 -->
      <div class="info-wrap content-wrap info-content">

        <!-- 탭 버튼 -->
        <div class="tab-bar">
          <button
            v-if="isMyLecture"
            :class="['tab-btn', activeTab === 'students' ? 'active' : '']"
            @click="activeTab = 'students'"
          >수강학생목록</button>
          <button
            :class="['tab-btn', activeTab === 'detail' ? 'active' : '']"
            @click="activeTab = 'detail'"
          >강의상세</button>
        </div>

        <!-- 수강학생목록 탭 -->
        <div v-if="isMyLecture && activeTab === 'students'" class="tab-content">
          <div class="tab-toolbar">
            <span class="student-count">총 수강인원 : {{ state.studentList.length }}명</span>
            <div class="toolbar-btns" v-if="canEdit && isMyLecture">
              <button class="btn btn-default" @click="router.push(`/lectures/${id}/attendance`)">출석관리</button>
              <button class="btn btn-default" @click="router.push(`/lectures/${id}/grades`)">성적관리</button>
            </div>
          </div>

          <DataTable
            :columns="['학과', '학번', '이름', '학년', '출석/지각/결석', '점수']"
            :rows="pagedStudentList"
            gridCols="1fr 100px 1fr 100px 1fr 70px"
            emptyMessage="수강 학생이 없습니다"
          >
            <article class="tbl-row no-hover" v-for="student in pagedStudentList" :key="student.studentCode">
              <div>{{ student.majorName }}</div>
              <div>{{ student.studentCode }}</div>
              <div>{{ student.studentName }}</div>
              <div>{{ student.academicYear }}학년</div>
              <div>{{ student.attendCount }}/{{ student.lateCount }}/{{ student.absentCount }}</div>
              <div>
                <span :class="['grade-badge', student.gradeLetter]">
                  {{ student.gradeLetter || '-' }}
                </span>
              </div>
            </article>
          </DataTable>

          <Pagination
            :currentPage="currentPage"
            :maxPage="maxPageStudent"
            :pageGroupSize="10"
            @goToPage="goToPage"
          />
        </div>

        <!-- 강의상세 탭 -->
        <div v-if="activeTab === 'detail'" class="tab-content d-flex direct-col g30">
          <dl>
            <dt>참조 교재</dt>
            <dd>{{ state.data.refBooks }}</dd>
          </dl>
          <dl>
            <dt>강의 목표</dt>
            <dd>{{ state.data.goal }}</dd>
          </dl>
          <dl>
            <dt>주차별 계획</dt>
            <dd>{{ state.data.weeklyPlan }}</dd>
          </dl>
        </div>

        <!-- 반려사유 박스: 탭 상관없이 항상 노출-->
        <div
          v-if="state.data.status === '반려' && state.data.rejectionReason"
          class="rejection-info-box"
        >
          <p class="rejection-info-title">반려사유</p>
          <p class="rejection-info-reason">{{ state.data.rejectionReason }}</p>
          <p class="rejection-info-at" v-if="state.data.rejectionAt">
            {{ new Date(state.data.rejectionAt).toLocaleString() }}
          </p>
        </div>  

      </div><!-- /info-content -->

    </div><!-- /info-container -->

  </div><!-- /container -->
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.action-group { display: flex; gap: 8px; }

/* 반려사유 입력박스 (관리자용) */
.rejection-box { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; padding: 16px; background: #fff8f8; border: 1px solid #ffcdd2; border-radius: 8px; }
.rejection-textarea { width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; resize: vertical; font-size: var(--text-sm); font-family: inherit; line-height: 1.5; }
.rejection-textarea:focus { outline: none; border-color: #c62828; }
.rejection-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* 좌측 카드 */
.info-list { display: flex; flex-direction: column; }
.info-row { flex-direction: row; gap: 15px; padding: 10px 0; }
.info-row:not(:first-child) { border-top: 1px solid var(--line-color); }
.info-row dt { width: 55px; text-align: right; }
.info-card dl { align-items: center; }
.info-card dl:last-child { align-items: flex-start; }
.info-card dl:last-child dt { padding-top: 2px; }

/* 탭 바 */
.tab-bar { display: flex; align-items: center; border-bottom: 1px solid var(--line-color); }
.tab-btn { padding: var(--size-sm) var(--size-lg); font-weight: 500; background: none; border: none; cursor: pointer; color: var(--font-color-light); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
.tab-btn.active { color: var(--main-color); border-bottom-color: var(--main-color); font-weight: 700; }
.tab-btn:hover { color: var(--main-color); }

/* 탭 내용 */
.tab-content { padding: var(--size-df); }
.tab-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--size-sm); }
.student-count { font-size: var(--text-sm); color: #555; }
.tab-content dl { padding: 5px; }
.tab-content dl:not(:first-child) { border-top: 1px solid var(--line-color); padding-top: 20px; }
.toolbar-btns { display: flex; gap: 8px; }

/* 버튼 */
.btn-success { background: var(--main-color); color: white; }
.btn-success:hover { background: #1b5e20; }
.btn-danger { background: #c62828; color: white; }
.btn-danger:hover { background: #b71c1c; }
.btn-outline { background: white; color: #555; border: 1px solid #ccc; }
.btn-outline:hover { background: #f5f5f5; }

/* 상태 배지 */
.status-badge { padding: 4px 8px; border-radius: 4px; font-size: var(--text-xs); font-weight: 500; }
.status-badge.pending { background: #fff3e0; color: #ef6c00; }
.status-badge.rejected { background: #ffebee; color: #c62828; }

/* 반려사유 박스 (하단 노출용) */
.rejection-info-box { margin: var(--size-df); border: 1px solid #ffcdd2; border-radius: 8px; padding: 16px; background: #fff8f8; }
.rejection-info-title { font-weight: 700; color: #c62828; margin: 0 0 8px; }
.rejection-info-reason { color: #333; margin: 0 0 8px; font-size: var(--text-sm); }
.rejection-info-at { color: #999; font-size: var(--text-xs); margin: 0; text-align: right; }

/* 성적 배지 */
.grade-badge { display: inline-block; width: 27px; height: 27px; line-height: 27px; border-radius: 50%; font-size: 13px; font-weight: 700; text-align: center; }
.grade-badge.A { background: #e8f5e9; color: #2e7d32; }
.grade-badge.B { background: #e3f2fd; color: #1565c0; }
.grade-badge.C { background: #fff8e1; color: #f57f17; }
.grade-badge.D { background: #fce4ec; color: #c62828; }
.grade-badge.F { background: #eeeeee; color: #757575; }
</style>