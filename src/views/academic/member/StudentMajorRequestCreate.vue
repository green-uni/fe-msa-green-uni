<script setup>
import { reactive, ref, watch, onMounted, nextTick } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import { usePageStateStore } from '@/stores/pageState';
import codeListService from '@/services/codeService';
import MemberService from '@/services/memberService';
import ScheduleService from '@/services/scheduleService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const authStore = useAuthStore();
const modal = useModalStore();
const pageState = usePageStateStore();

const DRAFT_KEY = 'majorRequestDraft';
const today = new Date().toISOString().slice(0, 10);

const isReady = ref(false);
const isLoading = ref(false);
const isPeriod = ref(true);
const majorList = ref([]);
const typeOptions = ref([]);

const form = reactive({ type: '', targetMajorId: '', reason: '' });
const file = ref(null);
const fileInput = ref(null);

// ── 임시저장 ─────────────────────────────────────────
const handleTempSave = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form }));
    modal.showAlert('임시저장 되었습니다.', 'info');
};

const loadDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    try {
        Object.assign(form, JSON.parse(raw));
        return true;
    } catch {
        localStorage.removeItem(DRAFT_KEY);
        return false;
    }
};

// ── 초기화 ────────────────────────────────────────────
const resetForm = async () => {
    const confirmed = await modal.showConfirm('입력한 내용이 모두 초기화됩니다. 계속하시겠습니까?', 'warning');
    if (!confirmed) return;
    isReady.value = false;
    Object.assign(form, { type: '', targetMajorId: '', reason: '' });
    file.value = null;
    if (fileInput.value) fileInput.value.value = '';
    localStorage.removeItem(DRAFT_KEY);
    pageState.setContent(false);
    await nextTick();
    isReady.value = true;
    modal.showAlert('내용이 모두 초기화되었습니다.', 'info');
};

// ── 유효성 ────────────────────────────────────────────
const validate = () => {
    const errors = [];
    if (!form.type) errors.push('유형을 선택해주세요.');
    if (!form.targetMajorId) errors.push('희망 학과를 선택해주세요.');
    if (!form.reason.trim()) errors.push('신청 사유를 입력해주세요.');
    if (errors.length > 0) { modal.showAlert(errors.join('\n'), 'warning'); return false; }
    return true;
};

// ── 제출 ──────────────────────────────────────────────
const submit = async () => {
    if (!validate() || isLoading.value) return;
    const formData = new FormData();
    formData.append('req', new Blob([JSON.stringify({
        type: form.type,
        targetMajorId: form.targetMajorId,
        reason: form.reason,
    })], { type: 'application/json' }));
    if (file.value) formData.append('file', file.value);
    isLoading.value = true;
    try {
        await MemberService.sendMajorRequest(formData);
        localStorage.removeItem(DRAFT_KEY);
        pageState.setContent(false);
        await modal.showAlert('신청이 완료되었습니다.', 'success');
        router.push('/members/major-request');
    } catch (err) {
        console.error('신청 실패:', err);
    } finally {
        isLoading.value = false;
    }
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const onFileChange = (e) => {
    const selected = e.target.files[0] ?? null;
    if (!selected) { file.value = null; return; }
    if (!ALLOWED_TYPES.includes(selected.type)) {
        modal.showAlert('PDF, JPG, PNG 파일만 업로드 가능합니다.', 'warning');
        fileInput.value.value = '';
        file.value = null;
        return;
    }
    if (selected.size > MAX_FILE_SIZE) {
        modal.showAlert('파일 크기는 5MB를 초과할 수 없습니다.', 'warning');
        fileInput.value.value = '';
        file.value = null;
        return;
    }
    file.value = selected;
};

// ── 이탈 경고 ─────────────────────────────────────────
onBeforeRouteLeave(async (_to, _from, next) => {
    if (pageState.isContent) {
        const confirmed = await modal.showConfirm('입력한 내용이 저장되지 않습니다. 나가시겠습니까?', 'warning');
        confirmed ? next() : next(false);
    } else {
        next();
    }
});

watch([() => ({ ...form }), file], () => {
    if (isReady.value) pageState.setContent(true);
});

const ALLOWED_STATUSES = ['ENROLLED', 'ABSENCE']

// ── 초기 데이터 ───────────────────────────────────────
onMounted(async () => {
    pageState.setContent(false)

    if (!ALLOWED_STATUSES.includes(authStore.status)) {
        await modal.showAlert('현재 학적 상태로는 신청할 수 없습니다.', 'warning');
        router.push('/members/major-request');
        return;
    }

    const res = await ScheduleService.getActiveSchedules();
    isPeriod.value = !!res.data?.data?.['전공변경신청'];
    if (!isPeriod.value) return;

    try {
        const listRes = await MemberService.findAllMyMajorRequest();
        const hasPending = (listRes.data ?? []).some(r => r.status === 'PENDING');
        if (hasPending) {
            await modal.showAlert('대기 중인 신청서가 있어 새로운 신청이 불가합니다.', 'warning');
            router.push('/members/major-request');
            return;
        }
    } catch {
        // 목록 조회 실패 시 백엔드가 처리
    }

    try {
        const [majors, types] = await Promise.all([
            MemberService.getMajorList(),
            codeListService.getMajorRequestType(),
        ]);
        majorList.value = majors.data ?? [];
        typeOptions.value = types.data ?? [];
    } catch (err) {
        console.error('옵션 로드 실패:', err);
    }

    await nextTick();
    isReady.value = true;

    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
        const confirmed = await modal.showConfirm('임시저장된 내용이 있습니다. 불러오시겠습니까?', 'info');
        confirmed ? loadDraft() : localStorage.removeItem(DRAFT_KEY);
    }
});
</script>

<template>
  <div>
    <div v-if="!isPeriod" class="empty-period">전공 변경 기간이 아닙니다.</div>
    <template v-else>
      <div class="form-wrap" style="position: relative; min-height: 200px;">
        <LoadingSpinner v-if="isLoading || !isReady" :overlay="true" size="md" />
        <template v-if="isReady">
          <div class="content-wrap d-flex direct-col">
            <h3><font-awesome-icon icon="fa-solid fa-file-pen" /> 전공 변경 신청</h3>
            <div class="form-grid" style="--grid-cols: 1fr 1fr 1fr;">
              <div class="input-wrap">
                <div class="input-label">이름</div>
                <div class="input-content">
                  <input type="text" :value="authStore.name" disabled />
                </div>
              </div>
              <div class="input-wrap">
                <div class="input-label">학번</div>
                <div class="input-content">
                  <input type="text" :value="authStore.memberCode" disabled />
                </div>
              </div>
              <div class="input-wrap">
                <div class="input-label">신청일</div>
                <div class="input-content">
                  <input type="text" :value="today" disabled />
                </div>
              </div>
              <div class="input-wrap">
                <div class="input-label">유형</div>
                <div class="input-content radio-group">
                  <label class="radio-label" v-for="opt in typeOptions" :key="opt.code">
                    <input type="radio" v-model="form.type" :value="opt.code" />{{ opt.value }}
                  </label>
                </div>
              </div>
              <div class="input-wrap">
                <div class="input-label">희망 학과</div>
                <div class="input-content">
                  <select v-model="form.targetMajorId">
                    <option value="">선택하세요</option>
                    <option v-for="m in majorList" :key="m.majorId" :value="m.majorId">{{ m.name }}</option>
                  </select>
                </div>
              </div>
              <div class="input-wrap input-grid-full">
                <div class="input-label">신청 사유</div>
                <div class="input-content">
                  <textarea v-model="form.reason" placeholder="신청 사유를 입력해주세요." />
                </div>
              </div>
              <div class="input-wrap input-grid-full">
                <div class="input-label">첨부 파일</div>
                <div class="input-content file-row">
                  <button type="button" class="btn btn-line" @click="fileInput.click()">서류 선택</button>
                  <input type="text" :value="file?.name ?? ''" placeholder="업로드된 파일 없음" disabled />
                  <input ref="fileInput" type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" @change="onFileChange" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-if="isReady" class="page-footer">
        <button class="btn btn-default" @click="router.push('/members/major-request')">
          <font-awesome-icon icon="fa-solid fa-arrow-left" /> 뒤로가기
        </button>
        <div class="action-group">
          <button class="btn btn-default" @click="resetForm">
            <font-awesome-icon icon="fa-solid fa-rotate-left" /> 초기화
          </button>
          <button class="btn btn-line point" @click="handleTempSave">
            <font-awesome-icon icon="fa-regular fa-floppy-disk" /> 임시저장
          </button>
          <button class="btn btn-submit" @click="submit" :disabled="isLoading">
            <font-awesome-icon icon="fa-solid fa-circle-check" /> {{ isLoading ? '신청 중...' : '신청' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.empty-period {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 18px;
  color: #999;
}
</style>
