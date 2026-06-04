<script setup>
import { useRoute, useRouter } from 'vue-router';
import { onMounted, reactive, ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import LectureService from '@/services/lectureService';
import SearchInput from '@/components/util/SearchInput.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import { BADGE_CLASS, BUILDING_LABEL } from '@/utils/constants';

const route = useRoute();
const router = useRouter();
const modal = useModalStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const activeTab = ref('detail');

// 재직중인 교수만 출석 및 성적 수정버튼 보이게 함
const canEdit = computed(() =>
  authStore.role === 'PROFESSOR' && authStore.status === 'EMPLOYMENT'
);
// 강의를 보는 사람이 그 강의를 개설한 교수일때만 수강학생이 노출
const isMyLecture = computed(() =>
  authStore.role === 'PROFESSOR' && state.data.memberCode === authStore.memberCode
);

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
    cancelReason: '',
    cancelAt: null,
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
  professorList.value.map(p => ({ ...p, displayName: `${p.name} (${p.majorName})` }))
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
    await LectureService.updateLectureStatus(id, { status: newStatus, adminName: authStore.name });
    state.data.status = '승인';
    state.data.approverName = authStore.name;
    state.data.approverCode = authStore.memberCode;
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
      reason: rejectionInput.value,
      adminName: authStore.name
    });
    state.data.status = '반려';
    state.data.rejectionReason = rejectionInput.value;
    state.data.rejectorName = authStore.name;
    state.data.rejectorCode = authStore.memberCode;
    state.data.rejectionAt = new Date().toISOString();
    showRejectionBox.value = false;
    rejectionInput.value = '';
  } catch (error) {
    console.error('반려 실패:', error);
  }
};

const formatDate = (dt) => dt ? String(dt).slice(0, 10) : '-';

const editLecture = () => router.push(`/lectures/edit/${id}`);

// 이전 목록으로 돌아가기
const goBackToList = () => {
  const from = route.query.from;
  const { from: _f, ...restQuery } = route.query;
  if (from === 'ADMIN') {
    router.push({ path: '/admin/lectures/my', query: restQuery });
  } else if (from === 'ALL') {
    const path = authStore.role === 'ADMIN' ? '/admin/lectures' : '/lectures';
    router.push({ path, query: restQuery });
  } else {
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
    modal.showAlert(error.response?.data?.result || '삭제에 실패했습니다.', 'error');
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
  isLoading.value = false;
});
</script>

<template>
  <div class="detail-wrap" :class="[{ 'no-color-mode': ['취소', '반려', '대기'].includes(state.data.status) }]">
    <LoadingSpinner v-if="isLoading" />

    <template v-if="!isLoading && state.data.lectureName">

      <!-- Card 1: 강의 기본 정보 -->
      <section class="card">
        <div class="card-label">
          <span>
            {{ state.data.lectureName }}
            <span v-if="state.data.status === '대기'"  :class="BADGE_CLASS.PENDING">대기</span>
            <span v-else-if="state.data.status === '반려'" :class="BADGE_CLASS.REJECTED">반려</span>
            <span v-else-if="state.data.status === '취소'" :class="BADGE_CLASS.CANCELLED">폐강</span>
          </span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-key">교수명</span>
            <span class="info-val">{{ state.data.proName }}({{ state.data.memberCode }})</span>
          </div>
          <div class="info-item">
            <span class="info-key">학년/학기</span>
            <span class="info-val">{{ state.data.year }}년 {{ state.data.semester }}학기</span>
          </div>
          <div class="info-item">
            <span class="info-key">이수구분</span>
            <span class="info-val">{{ state.data.lectureType }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">이수학점</span>
            <span class="info-val">{{ state.data.credit }}학점</span>
          </div>
          <div class="info-item" v-if="authStore.role === 'PROFESSOR' || authStore.role === 'ADMIN'">
            <span class="info-key">수강인원</span>
            <span class="info-val">{{ state.studentList.length }} / {{ state.data.maxStd }}</span>
          </div>
          <template v-if="state.data.schedules?.length">
            <div class="info-item">
              <span class="info-key">강의실</span>
              <span class="info-val">
                <span v-for="(s, i) in state.data.schedules" :key="i" style="display:block">
                  {{ BUILDING_LABEL[s.building] ?? s.building }} {{ s.room }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-key">강의시간</span>
              <span class="info-val">
                <span v-for="(s, i) in state.data.schedules" :key="i" style="display:block">
                  {{ s.dayOfWeek }}요일 {{ s.startPeriod }}교시 ~ {{ s.endPeriod }}교시
                </span>
              </span>
            </div>
          </template>
          <div class="info-item" style="grid-column: span 2" v-if="state.data.startDate || state.data.endDate">
            <span class="info-key">강의기간</span>
            <span class="info-val">{{ formatDate(state.data.startDate) }} ~ {{ formatDate(state.data.endDate) }}</span>
          </div>
        </div>
      </section>

      <!-- Card 2: 강의 상세 -->
      <section class="card">
        <div class="card-label">강의 상세</div>
        <dl class="req-list">
          <div class="req-row full">
            <dt>참조교재</dt>
            <dd>{{ state.data.refBooks || '-' }}</dd>
          </div>
          <div class="req-row full">
            <dt>강의목표</dt>
            <dd class="reason-text">{{ state.data.goal || '-' }}</dd>
          </div>
          <div class="req-row full">
            <dt>주차별계획</dt>
            <dd class="reason-text">{{ state.data.weeklyPlan || '-' }}</dd>
          </div>
        </dl>
        <!-- 폐강사유 -->
        <div v-if="state.data.status === '취소' && state.data.cancelReason" class="result-box rejected">
          <p class="result-title"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /> 폐강 사유</p>
          <p class="result-body">{{ state.data.cancelReason }}</p>
          <p class="result-at" v-if="state.data.cancelAt">{{ new Date(state.data.cancelAt).toLocaleString() }}</p>
        </div>
      </section>

      <!-- Card 3: 처리 정보 (교수/관리자 + 승인 or 반려 상태일 때만) -->
      <section
        v-if="(authStore.role === 'PROFESSOR' || authStore.role === 'ADMIN') && ['승인', '반려'].includes(state.data.status)"
        class="card"
      >
        <div class="card-label">{{ state.data.status === '승인' ? '승인 정보' : '반려 정보' }}</div>
        <div class="info-grid" style="grid-template-columns: 1fr">
          <div class="info-item" v-if="state.data.status === '반려'">
            <span class="info-key">반려사유</span>
            <span class="info-val">{{ state.data.rejectionReason || '-' }}</span>
          </div>
          <div class="info-item" v-if="state.data.status === '반려'">
            <span class="info-key">처리일</span>
            <span class="info-val">{{ formatDate(state.data.rejectionAt) || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-key">처리자</span>
            <span class="info-val">
              <template v-if="state.data.approverName || state.data.rejectorName">
                {{ state.data.approverName || state.data.rejectorName }}
                ({{ state.data.approverCode || state.data.rejectorCode }})
              </template>
              <template v-else>-</template>
            </span>
          </div>
        </div>
      </section>

    <!-- 수동폐강 입력박스 -->
    <div v-if="showCancelBox" class="action-box">
      <p class="action-box-title">폐강 사유</p>
      <textarea v-model="cancelReason" class="action-textarea" rows="3" />
      <div class="action-box-footer">
        <span class="char-count" :class="{ valid: cancelReason.trim().length >= 30 }">
          {{ cancelReason.trim().length }} / 255자 (30자 이상 작성필수)
        </span>
        <div class="action-buttons">
          <button class="btn btn-default" @click="showCancelBox = false">취소</button>
          <button class="btn btn-submit" :disabled="cancelReason.trim().length < 30" @click="submitCancel">폐강 처리</button>
        </div>
      </div>
    </div>

      <!-- 교수 변경 입력박스 -->
      <div v-if="showProfessorBox" class="action-box">
        <p class="action-box-title">담당 교수 변경</p>
        <div class="d-flex g10">
          <div class="professor-field d-flex direct-col g5" style="flex: 1">
            <label class="pf-label">교번</label>
            <input type="text" :value="selectedProfessorCode" disabled placeholder="-" class="pf-input" />
          </div>
          <div class="professor-field d-flex direct-col g5" style="flex: 2">
            <label class="pf-label">교수명</label>
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
        <div class="professor-field d-flex direct-col g5">
          <label class="pf-label">변경사유</label>
          <textarea v-model="professorChangeReason" class="action-textarea" placeholder="변경 사유를 입력해주세요." rows="3" />
        </div>
        <div class="action-buttons">
          <button class="btn btn-default" @click="showProfessorBox = false">취소</button>
          <button class="btn btn-default" @click="submitProfessorChange">변경 확정</button>
        </div>
      </div>

      <!-- 반려사유 입력박스 -->
      <div v-if="showRejectionBox" class="action-box reject">
        <textarea v-model="rejectionInput" class="action-textarea" placeholder="반려 사유를 입력해주세요." rows="3" />
        <div class="action-buttons">
          <button class="btn btn-default" @click="showRejectionBox = false; rejectionInput = ''">취소</button>
          <button class="btn btn-default" @click="submitRejection">반려 처리</button>
        </div>
      </div>

      <!-- 페이지 푸터 -->
      <div class="page-footer">
        <button class="btn btn-default" @click="goBackToList">
          <font-awesome-icon icon="fa-solid fa-list" /> 목록
        </button>
        <div class="action-group">
          <!-- 관리자: 승인 / 반려 (대기 상태) -->
          <template v-if="canApprove">
            <button v-if="!showRejectionBox" class="btn btn-submit" @click="updateStatus('APPROVED')">승인</button>
            <button v-if="!showRejectionBox" class="btn btn-default" @click="openRejectionBox">반려</button>
          </template>
          <!-- 관리자: 더보기 (수동폐강 / 교수변경, 승인 상태) -->
          <div v-if="canCancel" class="more-menu-wrap" ref="moreMenuRef">
            <button class="more-btn" @click="showMoreMenu = !showMoreMenu">⋯</button>
            <div v-if="showMoreMenu" class="more-dropdown">
              <button @click="openProfessorBox">교수 변경</button>
              <button @click="openCancelBox">강의 폐강</button>
            </div>
          </div>
          <!-- 교수: 수정 / 삭제 (내 강의 + 반려 상태 + 수강생 없음) -->
          <template v-if="canEdit && isMyLecture && state.data.status === '반려' && state.studentList.length === 0">
            <button class="btn btn-default" @click="editLecture">
              <font-awesome-icon icon="fa-solid fa-pen-to-square" /> 강의 정보 수정
            </button>
            <button class="btn btn-default" @click="deleteLecture">
              <font-awesome-icon icon="fa-solid fa-trash" /> 강의 삭제
            </button>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
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
  font-size: $fs-xs;
  cursor: pointer;
  color: #334155;
}
.more-dropdown button:hover { background: #f1f5f9; }

/* 교수 변경 폼 */
.pf-label { font-size: $fs-xs; color: #64748b; font-weight: 500; }
.professor-field :deep(input),
.professor-field .pf-input {
  border: 1px solid $bold-border-color;
  border-radius: 4px;
  padding: 8px 10px;
  width: 100%;
  background: #fcfcfc;
  color: $font-color;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  font-size: $fs-xs;
  font-family: inherit;
}
</style>
