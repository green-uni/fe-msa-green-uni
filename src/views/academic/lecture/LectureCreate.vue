<script setup>
import { computed, watch, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import LectureService from '@/services/lectureService';
import { onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import SearchInput from '@/components/util/SearchInput.vue';
import { useModalStore } from '@/stores/modal';
import CalendarDate from '@/components/util/CalendarDate.vue';

const modal = useModalStore();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// lectureType 한글 → 코드 변환
const LECTURE_TYPE_CODE = {
  '교양필수': 'GENERAL_REQUIRED',
  '교양선택': 'GENERAL_ELECTIVE',
  '전공필수': 'MAJOR_REQUIRED',
  '전공선택': 'MAJOR_ELECTIVE',
};

const state = reactive({
  majorList: [],
  scheduleList: ['월', '화', '수', '목', '금'],
  periodList: Array.from({ length: 9 }, (_, i) => i + 1),
  buildingList: [],
  roomListMap: {}, // { [idx]: roomList } 강의실 그룹별 목록
  data: {
    loginUserCode: '',
    loginUserName: '',
    majorId: 0,
    majorName: '',
    year: new Date().getFullYear(),
    semester: 0,
    lectureName: '',
    credit: '',
    lectureType: '',
    academicYear: '',
    maxStd: '',
    startDate: '',
    endDate: '',
    refBooks: '',
    goal: '',
    weeklyPlan: '',
    // 요일/교시 그룹
    timeSlots: [
      { dayOfWeek: '', startPeriod: '', endPeriod: '' }
    ],
    // 강의실 그룹
    rooms: [
      { building: '', room: '', roomId: null }
    ],
  },
});

// ── 요일/교시 추가/삭제 ────────────────────────────
const addTimeSlot = () => {
  state.data.timeSlots.push({ dayOfWeek: '', startPeriod: '', endPeriod: '' });
};
const removeTimeSlot = (idx) => {
  if (state.data.timeSlots.length === 1) return;
  state.data.timeSlots.splice(idx, 1);
};

// ── 강의실 추가/삭제 ──────────────────────────────
const addRoom = () => {
  state.data.rooms.push({ building: '', room: '', roomId: null });
};
const removeRoom = (idx) => {
  if (state.data.rooms.length === 1) return;
  state.data.rooms.splice(idx, 1);
  delete state.roomListMap[idx];
};

// ── 강의실 목록 불러오기 ──────────────────────────
const loadRoomsByIdx = async (idx) => {
  const building = state.data.rooms[idx].building;
  state.data.rooms[idx].room = '';
  state.data.rooms[idx].roomId = null;
  if (!building) { state.roomListMap[idx] = []; return; }
  try {
    const res = await LectureService.getRoomNumber({ building });
    state.roomListMap[idx] = res || [];
  } catch (err) {
    console.error('강의실 로드 실패:', err);
  }
};

// ── 강의실 선택 시 roomId 저장 ────────────────────
const onRoomSelect = (idx) => {
  const roomList = state.roomListMap[idx] || [];
  const found = roomList.find(r => r.room === state.data.rooms[idx].room);
  state.data.rooms[idx].roomId = found ? Number(found.roomId) : null;
};

// ── 강의실 용량 표시 ──────────────────────────────
const getRoomCapacity = (idx) => {
  const roomList = state.roomListMap[idx] || [];
  const found = roomList.find(r => r.room === state.data.rooms[idx].room);
  return found?.capacity ?? null;
};

// ── payload용 schedules 생성 ─────────────────────
// timeSlots N개 + rooms M개 → N개 스케줄
// rooms[i] 없으면 rooms[마지막] 사용
const buildSchedules = () => {
  const { timeSlots, rooms } = state.data;
  return timeSlots.map((slot, i) => {
    const room = rooms[i] ?? rooms[rooms.length - 1];
    return {
      roomId: Number(room.roomId),
      dayOfWeek: slot.dayOfWeek,
      startPeriod: Number(slot.startPeriod),
      endPeriod: Number(slot.endPeriod),
    };
  });
};

const isEdit = computed(() => !!route.params.lectureId);
const DRAFT_KEY = 'lecture_draft';
const isContent = ref(false);
const isMounted = ref(false);
const isSubmitting = ref(false);

const saveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(state.data));
const removeDraft = () => localStorage.removeItem(DRAFT_KEY);

watch(
  () => state.data,
  () => {
    if (!isEdit.value && isMounted.value) {
      saveDraft();
      isContent.value = true;
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (authStore.status?.toUpperCase() !== 'EMPLOYMENT') {
    await modal.showAlert('재직 중인 교수가 아닙니다.', 'error');
    router.replace('/lectures/my');
    return;
  }

  if (authStore.isLogin) {
    state.data.loginUserId = authStore.memberCode;
    state.data.loginUserCode = authStore.memberCode;
    state.data.loginUserName = authStore.name;
  }

  try {
    const majorRes = await LectureService.getMajorList();
    state.majorList = majorRes.data || [];
  } catch (error) {
    console.error('전공 목록 로드 실패:', error);
  }

  try {
    const buildingRes = await LectureService.getBuildings();
    state.buildingList = buildingRes || [];
  } catch (error) {
    console.error('건물 목록 로드 실패:', error);
  }

  if (isEdit.value) {
    try {
      const res = await LectureService.getLectureDetail(route.params.lectureId);

      // lectureType 한글 → 코드 변환
      const lectureTypeCode = LECTURE_TYPE_CODE[res.lectureType] || res.lectureType;

      // startDate, endDate T 이전 날짜만 추출
      const startDate = res.startDate ? res.startDate.split('T')[0] : '';
      const endDate = res.endDate ? res.endDate.split('T')[0] : '';

      // schedules → timeSlots + rooms 분리
      const schedules = res.schedules || [];

      // timeSlots: 모든 스케줄의 요일/교시
      const timeSlots = schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startPeriod: s.startPeriod,
        endPeriod: s.endPeriod,
      }));

      // rooms: 중복 제거 (building + room 기준)
      const seen = new Set();
      const rooms = [];
      for (const s of schedules) {
        const key = `${s.building}__${s.room}`;
        if (!seen.has(key)) {
          seen.add(key);
          rooms.push({ building: s.building, room: s.room, roomId: null });
        }
      }

      Object.assign(state.data, {
        ...res,
        lectureType: lectureTypeCode,
        startDate,
        endDate,
        timeSlots: timeSlots.length ? timeSlots : [{ dayOfWeek: '', startPeriod: '', endPeriod: '' }],
        rooms: rooms.length ? rooms : [{ building: '', room: '', roomId: null }],
      });

      // 강의실 목록 불러오기 + roomId 세팅
      for (let i = 0; i < state.data.rooms.length; i++) {
        const r = state.data.rooms[i];
        if (r.building) {
          const roomRes = await LectureService.getRoomNumber({ building: r.building });
          state.roomListMap[i] = roomRes || [];
          const found = (roomRes || []).find(item => item.room === r.room);
          state.data.rooms[i].roomId = found ? Number(found.roomId) : null;
        }
      }
    } catch (error) {
      console.error('강의 데이터 로드 실패:', error);
      modal.showAlert('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
  } else {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      const isConfirm = await modal.showConfirm('기존에 작성 중이던 내용을 불러오시겠습니까?', 'info');
      if (isConfirm) {
        const draftData = JSON.parse(draft);
        Object.assign(state.data, draftData);
        for (let i = 0; i < (state.data.rooms || []).length; i++) {
          const r = state.data.rooms[i];
          if (r.building) {
            const roomRes = await LectureService.getRoomNumber({ building: r.building });
            state.roomListMap[i] = roomRes || [];
          }
        }
        isContent.value = true;
      } else {
        removeDraft();
      }
    }
  }
  isMounted.value = true;
});

const submitLecture = async () => {
  if (isSubmitting.value) return;

  // 요일/교시 필수 체크
  const hasEmptySlot = state.data.timeSlots.some(
    s => !s.dayOfWeek || !s.startPeriod || !s.endPeriod
  );
  if (hasEmptySlot) {
    await modal.showAlert('강의 시간을 모두 입력해주세요.', 'error');
    return;
  }

  // 교시 순서 체크
  const hasInvalidPeriod = state.data.timeSlots.some(
    s => s.startPeriod && s.endPeriod && Number(s.startPeriod) > Number(s.endPeriod)
  );
  if (hasInvalidPeriod) {
    await modal.showAlert('시작 교시는 종료 교시보다 작아야 합니다.', 'error');
    return;
  }

  // 강의실 필수 체크
  const hasEmptyRoom = state.data.rooms.some(r => !r.building || !r.room);
  if (hasEmptyRoom) {
    await modal.showAlert('강의실을 모두 선택해주세요.', 'error');
    return;
  }

  // 필수 항목 체크
  const required = [
    { value: state.data.lectureName, label: '강의명' },
    { value: state.data.semester, label: '학기' },
    { value: state.data.startDate, label: '시작일자' },
    { value: state.data.endDate, label: '종료일자' },
    { value: state.data.lectureType, label: '이수구분' },
    { value: state.data.credit, label: '이수학점' },
    { value: state.data.majorId, label: '전공명' },
    { value: state.data.academicYear, label: '대상학년' },
    { value: state.data.maxStd, label: '수강인원' },
    { value: state.data.refBooks, label: '참고 교재' },
    { value: state.data.goal, label: '강의 목표' },
    { value: state.data.weeklyPlan, label: '주차별 강의 계획' }
  ];

  const emptyField = required.find(f => !f.value || f.value === '' || f.value === 0);
  if (emptyField) {
    await modal.showAlert(`${emptyField.label}을(를) 입력해주세요.`, 'error');
    return;
  }

  const payload = {
    majorId: (state.data.majorId),
    year: Number(state.data.year),
    semester: state.data.semester,
    lectureName: state.data.lectureName,
    credit: state.data.credit,
    lectureType: state.data.lectureType,
    refBooks: state.data.refBooks,
    goal: state.data.goal,
    weeklyPlan: state.data.weeklyPlan,
    academicYear: state.data.academicYear,
    maxStd: Number(state.data.maxStd),
    startDate: state.data.startDate?.includes('T') ? state.data.startDate : `${state.data.startDate}T00:00:00`,
    endDate: state.data.endDate?.includes('T') ? state.data.endDate : `${state.data.endDate}T00:00:00`,
    schedules: buildSchedules(),
  };

  try {
    isSubmitting.value = true;
    if (isEdit.value) {
      await LectureService.editLecture(route.params.lectureId, payload);
      await modal.showAlert('강의정보가 수정되었습니다.', 'success');
      router.push('/lectures/my');
    } else {
      await LectureService.postLecture(payload);
      removeDraft();
      isContent.value = false;
      await modal.showAlert('강의가 신청되었습니다.', 'success');
      router.push('/lectures/my');
    }
  } catch (err) {
    console.error('저장 실패:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const syncMajorId = () => {
  const found = state.majorList.find(m => m.majorName === state.data.majorName);
  state.data.majorId = found ? found.majorId : 0;
};

onBeforeRouteLeave(async (to, from, next) => {
  if (isContent.value) {
    saveDraft();
    await modal.showAlert('임시저장 되었습니다.', 'info');
    next();
  } else {
    next();
  }
});
</script>

<template>
  <div class="container">
    <div class="form-wrap">

      <!-- 교수 정보 (개설 모드만 노출) -->
      <div class="content-wrap" v-if="!isEdit">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 교수정보</h3>
        <div class="form-grid" style="--grid-cols: repeat(auto-fill, minmax(300px, 1fr))">
          <div class="input-wrap">
            <div class="input-label">교번</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.loginUserCode" disabled /></label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">교수명</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.loginUserName" disabled /></label>
            </div>
          </div>
        </div>
      </div>

      <!-- 개설 강의 정보 -->
      <div class="content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 개설강의정보</h3>
        <div class="form-grid" style="--grid-cols: repeat(2, 1fr)">

          <div class="input-wrap">
            <div class="input-label">강의연도</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.year" disabled /></label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">학기</div>
            <div class="input-content radio-group">
              <label class="radio-label">
                <input type="radio" name="semester" :value="1" v-model="state.data.semester" />
                <span>1학기</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="semester" :value="2" v-model="state.data.semester" />
                <span>2학기</span>
              </label>
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">시작일자</div>
            <div class="input-content">
              <CalendarDate v-model="state.data.startDate" />
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">종료일자</div>
            <div class="input-content">
              <CalendarDate v-model="state.data.endDate" />
            </div>
          </div>

          <div class="input-wrap">
            <div class="input-label">이수구분</div>
            <div class="input-content radio-group">
              <label class="radio-label">
                <input type="radio" name="lectureType" value="GENERAL_REQUIRED" v-model="state.data.lectureType" />
                <span>교양필수</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="lectureType" value="GENERAL_ELECTIVE" v-model="state.data.lectureType" />
                <span>교양선택</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="lectureType" value="MAJOR_REQUIRED" v-model="state.data.lectureType" />
                <span>전공필수</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="lectureType" value="MAJOR_ELECTIVE" v-model="state.data.lectureType" />
                <span>전공선택</span>
              </label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">이수학점</div>
            <div class="input-content radio-group">
              <label class="radio-label" v-for="c in [1,2,3]" :key="c">
                <input type="radio" name="credit" :value="c" v-model="state.data.credit" />
                <span>{{ c }}학점</span>
              </label>
            </div>
          </div>

          <div class="input-wrap input-grid2">
            <div class="input-label">강의명</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.lectureName" /></label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">수강인원</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.maxStd" /></label>
            </div>
          </div>

          <div class="input-wrap input-grid2">
            <div class="input-label">전공명</div>
            <div class="input-content">
              <SearchInput
                :showOnFocus="true"
                v-model="state.data.majorName"
                :list="state.majorList"
                labelKey="majorName"
                placeholder="전공명을 입력하세요"
                @select="(major) => (state.data.majorId = major.majorId)"
                @input="syncMajorId"
                @focus="state.data.majorName = ''"
              />
            </div>
          </div>

          <div class="input-wrap input-grid2">
            <div class="input-label">대상학년</div>
            <div class="input-content radio-group">
              <label class="radio-label" v-for="y in [1,2,3,4]" :key="y">
                <input type="radio" name="academicYear" :value="y" v-model="state.data.academicYear" />
                <span>{{ y }}학년</span>
              </label>
            </div>
          </div>

          <!-- 강의시간 -->
          <div class="input-wrap input-grid2">
            <div class="input-label">강의시간</div>
            <div class="input-content" style="display:flex; flex-direction:column; gap:8px;">
              <div
                v-for="(slot, idx) in state.data.timeSlots"
                :key="idx"
                style="display:flex; align-items:center; gap:5px;"
              >
                <select v-model="slot.dayOfWeek" style="flex:1">
                  <option value="">---요일선택---</option>
                  <option v-for="(day, i) in state.scheduleList" :key="i" :value="day">{{ day }}요일</option>
                </select>
                <select v-model="slot.startPeriod" style="flex:1">
                  <option value="">시작 교시</option>
                  <option v-for="period in state.periodList" :key="period" :value="period">{{ period }}교시</option>
                </select>
                <select v-model="slot.endPeriod" style="flex:1">
                  <option value="">종료 교시</option>
                  <option v-for="period in state.periodList" :key="period" :value="period">{{ period }}교시</option>
                </select>
                <button
                  v-if="state.data.timeSlots.length > 1"
                  class="btn btn-default" @click="removeTimeSlot(idx)"
                  style="padding:8px; flex-shrink:0;"
                >
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <button
                  v-if="idx === state.data.timeSlots.length - 1"
                  class="btn btn-line" @click="addTimeSlot"
                  style="padding:8px; flex-shrink:0;"
                >
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </button>
              </div>
            </div>
          </div>

          <!-- 강의실 -->
          <div class="input-wrap input-grid2">
            <div class="input-label">강의실</div>
            <div class="input-content" style="display:flex; flex-direction:column; gap:8px;">
              <div
                v-for="(room, idx) in state.data.rooms"
                :key="idx"
                style="display:flex; align-items:center; gap:8px;"
              >
                <select v-model="room.building" @change="loadRoomsByIdx(idx)" style="flex:1">
                  <option value="">---건물선택---</option>
                  <option v-for="building in state.buildingList" :key="building.code" :value="building.code">
                    {{ building.value }}
                  </option>
                </select>
                <select v-model="room.room" @change="onRoomSelect(idx)" style="flex:1">
                  <option value="">---강의실선택---</option>
                  <option v-for="item in (state.roomListMap[idx] || [])" :key="item.roomId" :value="item.room">
                    {{ item.room }}
                  </option>
                </select>
                <span
                  v-if="room.room && getRoomCapacity(idx)"
                  style="white-space:nowrap; font-size:var(--text-sm); color:var(--font-color-light); flex-shrink:0;"
                >
                  최대수용 {{ getRoomCapacity(idx) }}명
                </span>
                <button
                  v-if="state.data.rooms.length > 1"
                  class="btn btn-default" @click="removeRoom(idx)"
                  style="padding:8px; flex-shrink:0;"
                >
                  <font-awesome-icon icon="fa-solid fa-minus" />
                </button>
                <button
                  v-if="idx === state.data.rooms.length - 1"
                  class="btn btn-line" @click="addRoom"
                  style="padding:8px; flex-shrink:0;"
                >
                  <font-awesome-icon icon="fa-solid fa-plus" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 강의계획서 -->
      <div class="content-wrap">
        <h3><font-awesome-icon icon="fa-solid fa-circle-info" /> 강의계획서</h3>
        <div class="form-grid">
          <div class="input-wrap">
            <div class="input-label">참고 교재</div>
            <div class="input-content">
              <label><input type="text" v-model="state.data.refBooks" /></label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">강의 목표</div>
            <div class="input-content">
              <label><textarea v-model="state.data.goal"></textarea></label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">주차별 강의 계획</div>
            <div class="input-content">
              <label><textarea v-model="state.data.weeklyPlan"></textarea></label>
            </div>
          </div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-submit" @click="submitLecture" :disabled="isSubmitting">
          <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isEdit ? '수정하기' : '개설신청' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>