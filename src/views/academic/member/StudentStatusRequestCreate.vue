<script setup>
import { reactive, ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/authentication';
import { useModalStore } from '@/stores/modal';
import { usePageStateStore } from '@/stores/pageState';
import codeListService from '@/services/codeService';
import MemberService from '@/services/memberService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const router = useRouter();
const authStore = useAuthStore();
const modal = useModalStore();
const pageState = usePageStateStore();

const DRAFT_KEY = 'statusRequestDraft';
const today = new Date().toISOString().slice(0, 10);
const currentYear = new Date().getFullYear();

const isReady = ref(false);
const isLoading = ref(false);
const typeOptions = ref([]);

const form = reactive({ type: '', reason: '', startDate: today, returnYear: '', returnSemester: '' });
const file = ref(null);
const fileInput = ref(null);

const isAbsence = computed(() => form.type === 'ABSENCE');
const isQuit = computed(() => form.type === 'QUIT');
const isReturn = computed(() => form.type === 'RETURN');

const STATUS_TYPE_ALLOW = {
  ENROLLED: ['ABSENCE', 'QUIT'],
  ABSENCE: ['RETURN', 'QUIT'],
};
const filteredTypeOptions = computed(() =>
  typeOptions.value.filter(opt => (STATUS_TYPE_ALLOW[authStore.status] ?? []).includes(opt.code))
);

const returnYearOptions = computed(() => {
    const years = [];
    for (let y = currentYear; y <= currentYear + 3; y++) years.push(y);
    return years;
});

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
    Object.assign(form, { type: '', reason: '', startDate: today, returnYear: '', returnSemester: '' });
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
    if (!form.type) errors.push('신청 유형을 선택해주세요.');
    if (!form.startDate) errors.push('시작일을 입력해주세요.');
    if (!form.reason.trim()) errors.push('신청 사유를 입력해주세요.');
    if (isAbsence.value) {
        if (!form.returnYear) errors.push('복학 예정 연도를 선택해주세요.');
        if (!form.returnSemester) errors.push('복학 예정 학기를 선택해주세요.');
    }
    if (errors.length > 0) { modal.showAlert(errors.join('\n'), 'warning'); return false; }
    return true;
};

// ── 제출 ──────────────────────────────────────────────
const submit = async () => {
    if (!validate() || isLoading.value) return;
    const reqObj = {
        type: form.type,
        reason: form.reason,
        startDate: form.startDate,
    };
    if (isAbsence.value) {
        reqObj.returnYear = Number(form.returnYear);
        reqObj.returnSemester = Number(form.returnSemester);
    }
    const formData = new FormData();
    formData.append('req', new Blob([JSON.stringify(reqObj)], { type: 'application/json' }));
    if (file.value) formData.append('file', file.value);
    isLoading.value = true;
    try {
        await MemberService.sendStatusRequest(formData);
        localStorage.removeItem(DRAFT_KEY);
        pageState.setContent(false);
        await modal.showAlert('신청이 완료되었습니다.', 'success');
        router.push('/members/status-request');
    } catch (err) {
        console.error('신청 실패:', err);
    } finally {
        isLoading.value = false;
    }
};

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const onFileChange = (e) => {
    const selected = e.target.files[0] ?? null;
    if (!selected) { file.value = null; return; }
    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
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

watch(() => form.type, () => {
    form.returnYear = '';
    form.returnSemester = '';
});

const ALLOWED_STATUSES = ['ENROLLED', 'ABSENCE'];

onMounted(async () => {
    pageState.setContent(false);
    if (!ALLOWED_STATUSES.includes(authStore.status)) {
        await modal.showAlert('현재 학적 상태로는 신청할 수 없습니다.', 'warning');
        router.push('/members/status-request');
        return;
    }
    try {
        const listRes = await MemberService.findAllMyStatusRequests();
        const hasPending = (listRes.data ?? []).some(r => r.status === 'PENDING');
        if (hasPending) {
            await modal.showAlert('대기 중인 신청서가 있어 새로운 신청이 불가합니다.', 'warning');
            router.push('/members/status-request');
            return;
        }
    } catch {
    // 목록 조회 실패 시 백엔드가 처리
    }

    try {
        const types = await codeListService.getStatusRequestType();
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
    <div class="form-wrap" style="position: relative; min-height: 200px;">
      <LoadingSpinner v-if="isLoading || !isReady" :overlay="true" size="md" />
      <template v-if="isReady">
        <div class="content-wrap d-flex direct-col">
          <h3><font-awesome-icon icon="fa-solid fa-file-pen" /> 학적 변동 신청</h3>
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
              <div class="input-label">신청 유형<span class="required">*</span></div>
              <div class="input-content radio-group">
                <label class="radio-label" v-for="opt in filteredTypeOptions" :key="opt.code">
                  <input type="radio" v-model="form.type" :value="opt.code" />{{ opt.value }}
                </label>
              </div>
            </div>
            <div class="input-wrap">
              <div class="input-label">시작일<span class="required">*</span></div>
              <div class="input-content">
                <input type="date" v-model="form.startDate" />
              </div>
            </div>
            <div class="input-wrap" v-if="isAbsence">
              <div class="input-label">복학 예정</div>
              <div class="input-content two-input">
                <select v-model="form.returnYear">
                  <option value="">연도</option>
                  <option v-for="y in returnYearOptions" :key="y" :value="y">{{ y }}년</option>
                </select>
                <select v-model="form.returnSemester">
                  <option value="">학기</option>
                  <option :value="1">1학기</option>
                  <option :value="2">2학기</option>
                </select>
              </div>
            </div>
            <div class="input-wrap input-grid-full">
              <div class="input-label">신청 사유<span class="required">*</span></div>
              <div class="input-content">
                <textarea v-model="form.reason" placeholder="신청 사유를 입력해주세요." />
              </div>
            </div>
            <div class="input-wrap input-grid-full input-file">
              <div class="input-label">첨부 파일</div>
              <div class="input-content file-row">
                <button type="button" class="btn btn-line point" @click="fileInput.click()">서류 선택</button>
                <input type="text" :value="file?.name ?? ''" placeholder="업로드된 파일 없음" disabled />
                <input ref="fileInput" type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" @change="onFileChange" />
                <div class="file-info" v-if="isAbsence">
                  <span>※ 휴학 필수 서류</span>    
                  <div class="tbl-scroll"> 
                    <table class="data-tbl">
                      <colgroup>
                        <col style=""/>
                        <col/>
                      </colgroup>
                      <tbody>
                          <tr><th>질병 휴학</th><td class="tal">4주 이상 진단서 1부</td></tr>
                          <tr><th>육아 휴학</th><td class="tal">임신, 출산 및 육아 등 관련 사실을 입증할 증빙서류</td></tr>
                          <tr><th>군입대 휴학</th><td class="tal">군입영통지서 사본 1부  (입대 후는 군복무확인서)</td></tr>
                          <tr><th>창업 휴학</th><td class="tal">(필수)사업자등록증 사본 (해당자)성적증명서, (해당자)창업동아리증명서 </td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="file-info" v-if="isReturn">
                  <span>※ 복학 필수 서류</span>      
                  <div class="tbl-scroll"> 
                  <table class="data-tbl">
                    <colgroup>
                      <col style=""/>
                      <col/>
                    </colgroup>
                    <tbody>
                        <tr><th>일반 복학</th><td class="tal">필수 서류 없음</td></tr>
                        <tr><th>전역자(소집해제자)</th><td class="tal">전역증(군 경력증명서), 병적증명서 또는 주민등록초본, 병역증(후면 반드시 첨부)</td></tr>
                        <tr><th>전역예정자(소집해제예정자)</th><td class="tal">(현역) 부대 발행 전역예정증명서 / (사회복무요원 등) 복무확인서</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </div>

    <div v-if="isReady" class="page-footer">
      <button class="btn btn-default" @click="router.push('/members/status-request')">
        <font-awesome-icon icon="fa-solid fa-arrow-left" /> 돌아가기
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
  </div>
</template>

<style scoped lang="scss">
.input-file .input-label{align-self:self-start;padding-top: 6px;}
.file-row{flex-wrap:wrap;}
.file-info{width: 100%; span{display: block;margin-bottom: 4px;}}
</style>