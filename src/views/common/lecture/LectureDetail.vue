<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, reactive, ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import LectureService from '@/services/lectureService';
import SearchInput from '@/components/util/SearchInput.vue';
import { useAuthStore } from '@/stores/authentication';
import DataTable from '@/components/common/DataTable.vue';
import { useModalStore } from '@/stores/modal';
import Pagination from '@/components/common/Pagination.vue';
import { APPROVAL_STATUS, BADGE_CLASS, BUILDING_LABEL } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();
const authStore = useAuthStore();

// 재직중인 교수만 출석 및 성적 수정버튼 보이게 함
const canEdit = computed(() =>
  authStore.role === 'PROFESSOR' && authStore.status === 'EMPLOYMENT'
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
  authStore.role === 'ADMIN' && state.data.status === '대기'
);
const canReject = computed(() =>
  authStore.role === 'ADMIN' && state.data.status === '대기'
);

// 반려사유 입력박스
const showRejectionBox = ref(false);
const rejectionInput = ref('');

// 더보기 드롭다운
const showMoreMenu = ref(false);
const moreMenuRef = ref(null);
onClickOutside(moreMenuRef, () => { showMoreMenu.value = false; });

// 수동폐강
const showCancelBox = ref(false);
const cancelReason = ref('');
const canCancel = computed(() =>
  authStore.role === 'ADMIN' && state.data.status === '승인'
);
const openCancelBox = () => {
  showCancelBox.value = true;
  showProfessorBox.value = false;
  showMoreMenu.value = false;
  cancelReason.value = '';
};
const submitCancel = async () => {
  if (cancelReason.value.trim().length < 30) {
    modal.showAlert('폐강 사유를 30자 이상 입력해주세요.', 'warning');
    return;
  }
  const isConfirmed = await modal.showConfirm('강의를 폐강하시겠습니까? 이 작업은 되돌릴 수 없습니다.', 'warning');
  if (!isConfirmed) return;
  try {
    await LectureService.cancelLecture(id, { reason: cancelReason.value });
    modal.showAlert('강의가 폐강 처리되었습니다.', 'success');
    state.data.status = '취소';
    showCancelBox.value = false;
  } catch (e) {
    modal.showAlert(e.response?.data?.result || '폐강 처리에 실패했습니다.', 'error');
  }
};

// 교수 변경
const showProfessorBox = ref(false);
const professorChangeReason = ref('');
const selectedProfessor = ref(null);
const professorSearchText = ref('');
const professorList = ref([]);

const professorListWithLabel = computed(() =>
  professorList.value.map(p => ({
    ...p,
    displayName: `${p.name} (${p.majorName})`
  }))
);

const selectedProfessorCode = ref('');

const onProfessorSelect = (item) => {
  selectedProfessor.value = item.memberCode;
  selectedProfessorCode.value = item.memberCode;
};

const openProfessorBox = async () => {
  showProfessorBox.value = true;
  showCancelBox.value = false;
  showMoreMenu.value = false;
  professorChangeReason.value = '';
  selectedProfessor.value = null;
  selectedProfessorCode.value = '';
  professorSearchText.value = '';
  try {
    const res = await LectureService.getProfessorList();
    professorList.value = res.data ?? [];
  } catch (e) {
    console.error('교수 목록 조회 실패', e);
  }
};
const submitProfessorChange = async () => {
  if (!professorChangeReason.value.trim()) {
    modal.showAlert('변경 사유를 입력해주세요.', 'warning');
    return;
  }
  if (!selectedProfessor.value) {
    modal.showAlert('대체교수를 선택해주세요.', 'warning');
    return;
  }
  const isConfirmed = await modal.showConfirm('강의담당 교수를 변경하시겠습니까?', 'warning');
  if (!isConfirmed) return;
  try {
    await LectureService.changeLectureProfessor(id, {
      reason: professorChangeReason.value,
      newMemberCode: selectedProfessor.value,
    });
    modal.showAlert('담당 교수가 변경되었습니다.', 'success');
    const newProf = professorList.value.find(p => p.memberCode === selectedProfessor.value);
    if (newProf) state.data.proName = newProf.name;
    showProfessorBox.value = false;
  } catch (e) {
    modal.showAlert(e.response?.data?.result || '교수 변경에 실패했습니다.', 'error');
  }
};

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

const formatDate = (dt) => dt ? String(dt).slice(0, 10) : '-';

const editLecture = () => {
  router.push(`/lectures/edit/${id}`);
};

// 이전 목록으로 돌아가기
const goBackToList = () => {
  const from = route.query.from;
  if (from === 'ADMIN') {
    const { from, ...restQuery } = route.query;
    router.push({ path: '/admin/lectures/my', query: restQuery });
  } else if (from === 'ALL') {
    const { from, ...restQuery } = route.query;
    const path = authStore.role === 'ADMIN' ? '/admin/lectures' : '/lectures';
    router.push({ path, query: restQuery });
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
  <div :class="['container', { 'no-color-mode': ['취소', '반려', '대기'].includes(state.data.status) }]">

    <!-- 헤더 -->
    <div class="page-header">
      <button class="btn btn-default" @click="goBackToList">
        <font-awesome-icon icon="fa-solid fa-list" /> 목록
      </button>

      <!-- 관리자 버튼 -->
      <div class="action-group">
        <button v-if="canApprove" class="btn btn-subtle" @click="updateStatus('APPROVED')">승인</button>
        <button v-if="canReject && !showRejectionBox" class="btn btn-default" @click="openRejectionBox">반려</button>
        <div v-if="canCancel" class="more-menu-wrap" ref="moreMenuRef">
          <button class="more-btn" @click="showMoreMenu = !showMoreMenu">⋯</button>
          <div v-if="showMoreMenu" class="more-dropdown">
            <button @click="openProfessorBox">교수 변경</button>
            <button @click="openCancelBox">강의 폐강</button>
          </div>
        </div>
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

    <!-- 수동폐강 입력박스 -->
    <div v-if="showCancelBox" class="action-box cancel-box">
      <p class="action-box-title">폐강 사유</p>
      <textarea v-model="cancelReason" class="action-textarea" rows="3" />
      <div class="action-box-footer">
        <span class="char-count" :class="{ valid: cancelReason.trim().length >= 30 }">
          {{ cancelReason.trim().length }} / 255자 (30자 이상 작성필수)
        </span>
        <div class="action-box-btns">
          <button class="btn btn-default" @click="showCancelBox = false">취소</button>
          <button class="btn btn-confirm" :disabled="cancelReason.trim().length < 30" @click="submitCancel">폐강 처리</button>
        </div>
      </div>
    </div>

    <!-- 교수 변경 입력박스 -->
    <div v-if="showProfessorBox" class="action-box">
      <p class="action-box-title">담당 교수 변경</p>
      <div class="professor-form">
        <div class="professor-form-row">
          <div class="professor-field">
            <span class="pf-label">교번</span>
            <input type="text" :value="selectedProfessorCode" disabled placeholder="-" class="pf-input" />
          </div>
          <div class="professor-field">
            <span class="pf-label">교수명</span>
            <SearchInput
              v-model="professorSearchText"
              :list="professorListWithLabel"
              labelKey="displayName"
              valueKey="memberCode"
              placeholder="교수 이름으로 검색"
              :showOnFocus="true"
              @select="onProfessorSelect"
            />
          </div>
        </div>
        <div class="professor-field">
          <span class="pf-label">변경사유</span>
          <textarea v-model="professorChangeReason" class="action-textarea" placeholder="변경 사유를 입력해주세요." rows="3" />
        </div>
      </div>
      <div class="action-box-btns">
        <button class="btn btn-default" @click="showProfessorBox = false">취소</button>
        <button class="btn btn-confirm" @click="submitProfessorChange">변경 확정</button>
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
        <button class="btn btn-subtle" @click="submitRejection">사유 등록</button>
      </div>
    </div>

    <div class="info-container g20">

      <!-- 좌측 강의정보 카드 -->
      <div class="content-wrap info-wrap info-card g20" style="--flex-width:350px;">
        <div class="info-title">
          <div class="title-row">
            <h2>{{ state.data.lectureName }}</h2>
            <span v-if="state.data.status === '대기'" :class="['status-badge', BADGE_CLASS.PENDING]">대기</span>
            <span v-else-if="state.data.status === '반려'" :class="['status-badge', BADGE_CLASS.REJECTED]">반려</span>
            <span v-else-if="state.data.status === '취소'" :class="['status-badge', BADGE_CLASS.CANCELLED]">폐강</span>
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
          <dl class="info-row" v-if="authStore.role === 'PROFESSOR' || authStore.role === 'ADMIN'">
            <dt>수강인원</dt>
            <dd>{{ state.studentList.length }} / {{ state.data.maxStd }}</dd>
          </dl>
          <dl class="info-row" v-if="state.data.schedules && state.data.schedules.length > 0">
            <dt>강의실</dt>
            <dd>
              <div v-for="(s, i) in state.data.schedules" :key="i">
                {{ BUILDING_LABEL[s.building] ?? s.building }} {{ s.room }}
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
          <dl class="info-row" v-if="state.data.startDate || state.data.endDate">
            <dt>강의기간</dt>
            <dd>{{ formatDate(state.data.startDate) }} ~ {{ formatDate(state.data.endDate) }}</dd>
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
          <p class="rejection-info-title">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
            반려사유
          </p>
          <p class="rejection-info-reason">{{ state.data.rejectionReason }}</p>
          <p class="rejection-info-at" v-if="state.data.rejectionAt">
            {{ new Date(state.data.rejectionAt).toLocaleString() }}
          </p>
        </div>

        <!-- 폐강사유 박스 -->
        <div
          v-if="state.data.status === '취소' && state.data.cancelReason"
          class="cancel-info-box"
        >
          <p class="cancel-info-title">
            <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
            폐강사유
          </p>
          <p class="cancel-info-reason">{{ state.data.cancelReason }}</p>
          <p class="cancel-info-at" v-if="state.data.cancelAt">
            {{ new Date(state.data.cancelAt).toLocaleString() }}
          </p>
        </div>  

      </div><!-- /info-content -->

    </div><!-- /info-container -->

  </div><!-- /container -->
</template>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.action-group { display: flex; gap: 8px; align-items: center;}

/* 더보기 드롭다운 */
.more-menu-wrap { position: relative; }
.more-btn { font-size: 18px; font-weight: 700; letter-spacing: 2px; padding: 4px 10px; background: none; border: none; cursor: pointer; }
.more-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  min-width: 120px;
  z-index: 100;
  overflow: hidden;
}
.more-dropdown button {
  display: block;
  width: 100%;
  padding: 10px 16px;
  text-align: left;
  background: none;
  border: none;
  font-size: var(--text-sm);
  cursor: pointer;
  color: #334155;
}
.more-dropdown button:hover { background: #f1f5f9; }

/* 수동폐강 / 교수변경 공통 박스 */
.action-box { display: flex; flex-direction: column; gap: 10px; margin: 12px 0; padding: 16px; border-radius: 8px; background: #f8f8f7; border: 1px solid #e8e8e8; }
.action-box-title { font-weight: 700; font-size: var(--text-sm); margin: 0; color: #334155; }
.action-textarea { width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; resize: vertical; font-size: var(--text-sm); font-family: inherit; line-height: 1.5; }
.action-select { padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: var(--text-sm); }
.action-box-btns { display: flex; gap: 8px; justify-content: flex-end; }
.btn-subtle { background: #fafafa; color: #334155; }
.btn-subtle:hover { filter: brightness(0.9); }
.btn-confirm { background: #334155; color: #fff; border-color: #334155; }
.btn-confirm:hover { filter: brightness(1.1); }
.btn-confirm:disabled { background: #94a3b8; border-color: #94a3b8; cursor: not-allowed; filter: none; }
.action-box-footer { display: flex; justify-content: space-between; align-items: center; }
.char-count { font-size: var(--text-xs); color: #aaa; }
.char-count.valid { color: #334155; font-weight: 600; }

/* 교수 변경 폼 */
.professor-form { display: flex; flex-direction: column; gap: 10px; }
.professor-form-row { display: flex; gap: 16px; }
.professor-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.pf-label { font-size: var(--text-xs); color: #666; font-weight: 500; }
.professor-field :deep(input),
.professor-field .pf-input {
  border: 1px solid var(--table-border-color);
  border-radius: 4px;
  padding: 8px 10px;
  width: 100%;
  background: #fcfcfc;
  color: var(--color-font);
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  font-size: var(--text-sm);
  font-family: inherit;
}
.professor-field .pf-input:disabled { background: #f5f5f5; color: #ccc; }

/* 반려사유 입력박스 (관리자용) */
.rejection-box { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; padding: 16px; background: #f8f8f7; border: 1px solid #e8e8e8; border-radius: 8px; }
.rejection-textarea { width: 100%; padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; resize: vertical; font-size: var(--text-sm); font-family: inherit; line-height: 1.5; }
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
.badge-pending { background: #fff3e0; color: #ef6c00; }
.badge-rejected { background: #ffebee; color: #c62828; }
.badge-closed { background: #f1f5f9; color: #64748b; }

/* 반려사유 박스 (하단 노출용) */
.rejection-info-box { margin: var(--size-df); border: 2px solid #e53e3e; border-radius: 8px; padding: 16px 20px; background: #fff5f5; }
.rejection-info-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: var(--text-df); color: #c53030; margin: 0 0 10px; }
.rejection-info-reason { color: #333; margin: 0 0 10px; font-size: var(--text-sm); line-height: 1.6; }
.rejection-info-at { color: #94a3b8; font-size: var(--text-xs); margin: 0; text-align: right; }

/* 폐강사유 박스 */
.cancel-info-box {
  margin: var(--size-df);
  border: 2px solid #e53e3e;
  border-radius: 8px;
  padding: 16px 20px;
  background: #fff5f5;
}
.cancel-info-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: var(--text-df);
  color: #c53030;
  margin: 0 0 10px;
}
.cancel-info-reason { color: #333; margin: 0 0 10px; font-size: var(--text-sm); line-height: 1.6; }
.cancel-info-at { color: #94a3b8; font-size: var(--text-xs); margin: 0; text-align: right; }

/* 폐강/반려/대기 공통: 초록색 요소 회색으로 */
.no-color-mode .tab-btn.active { color: #475569; border-bottom-color: #475569; }
.no-color-mode .tab-btn:hover { color: #475569; }
.no-color-mode :deep(dt) { color: #475569; }

/* 강의명 + 배지 같은 행 */
.title-row { display: flex; align-items: center; gap: 8px; }

/* 성적 배지 */
.grade-badge { display: inline-block; width: 27px; height: 27px; line-height: 27px; border-radius: 50%; font-size: 13px; font-weight: 700; text-align: center; }
.grade-badge.A { background: #e8f5e9; color: #2e7d32; }
.grade-badge.B { background: #e3f2fd; color: #1565c0; }
.grade-badge.C { background: #fff8e1; color: #f57f17; }
.grade-badge.D { background: #fce4ec; color: #c62828; }
.grade-badge.F { background: #eeeeee; color: #757575; }
</style>