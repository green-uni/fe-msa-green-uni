<script setup>
import { ref, reactive } from 'vue';
import MailService from '@/services/mailService';
import AuthService from '@/services/authService';
import { useModalStore } from '@/stores/modal';
import { useRouter } from 'vue-router';
import PwCheckList from '@/components/util/PwCheckList.vue';
import { isValidEmail } from '@/utils/validation.js'

const modal = useModalStore();
const router = useRouter();

const pwCheck = ref(null)
const isShake = ref(false)
const triggerShake = () => {// 강조용 흔들기 효과
  isShake.value = true
  setTimeout(() => { isShake.value = false }, 400)
}

const state = reactive({
  memberCode: '20263001',
  email: 'tndud4615@gmail.com',
  verifyCode: '', // 인증코드
  memberId: null,  // 인증 완료 후 저장
  password: '',
  chkPw: '',
  modeShowPw: false,
  errors: { // 유효성 및 체크용
    password: false,
    chkPw: false
  }
})
// 로딩
const isLoading = ref(false)

// 비밀번호 보이기
const pwView = () => { state.modeShowPw = !state.modeShowPw }

// 초기화
const init = () => {
  Object.assign(state, {
    code: '', email: '', verifyCode: '', memberCode: null, password: '', chkPw: ''
  })
}

// 인증 단계
const step = ref(1)
const stepArray = [
  {
    step: 1,
    title: '이메일 인증',
    content: '로그인 코드와 등록된 이메일을 입력해주세요.',
    active: true
  },
  {
    step: 2,
    title: '코드입력',
    content: '이메일로 전송받은 인증코드 번호 5개를 입력해주세요.',
    active: false
  },
  {
    step: 3,
    title: '비밀번호 변경',
    content: '변경할 비밀번호를 작성해주세요',
    active: false
  },
]

// step 1: 이메일 발송
const sendEmail = async () => {
  if (!isValidEmail(state.email)) {
    await modal.showAlert('이메일 형식을 입력해주세요', 'info')
    return
  }
  try {
    isLoading.value = true  // 로딩 시작
    await MailService.sendCode({ memberCode: state.memberCode, email: state.email })
    step.value = 2 // step2로 이동
    stepArray[0].active = false
    stepArray[1].active = true
  } catch (e) { console.error(e) }
  finally {
    isLoading.value = false  // 로딩 끝 (성공/실패 상관없이)
  }
}

// step 2: 인증코드 확인
const checkCode = async () => {
  try {
    isLoading.value = true  // 로딩 시작
    const res = await MailService.checkCode({ email: state.email, verifyCode: state.verifyCode })
    await modal.showAlert(res.message, 'success')
    step.value = 3 // step3으로 이동
    stepArray[1].active = false
    stepArray[2].active = true
  } catch (e) { console.error(e) }
  finally {
    isLoading.value = false  // 로딩 끝 (성공/실패 상관없이)
  }
}

// step 3: 비밀번호 변경
const resetPw = async () => {
  // 새 비밀번호
  if (!state.password) {
    state.errors.password = true
    return
  }
  // 유효성 체크
  const checks = pwCheck.value?.checks
    if (!checks?.minLength || !checks?.letter || !checks?.number || !checks?.special) {
      triggerShake()
      return
    }
  // 비밀번호 확인
  if (state.password !== state.chkPw) {
    state.errors.chkPw = true
    return
  }
  try {
    const res = await AuthService.resetPw({ email: state.email, newPassword: state.password })
    await modal.showAlert(res.message, 'success')
    init();
    router.push('/') // 로그인 페이지로 이동
  } catch (e) { console.error(e) }
}

</script>
<template>
  <div class="h100vh d-flex jc-center ai-center">
    <!-- 이메일 입력 -->
    <div class="pw-wrap content-wrap">
      <div class="pw-step">
        <dl v-for="item in stepArray" :key=item.step :class="{ 'active': item.active }">
          <dt>{{ item.step }}</dt>
          <dd>{{ item.title }}</dd>
        </dl>
      </div>
      <div class="pw-content" v-if="step === 1">
        <div class="pw-title">
          <h2>{{ stepArray[0].title }}</h2>
          <p>{{ stepArray[0].content }}</p>
        </div>
        <div class="form-grid">
          <div class="input-wrap">
            <div class="input-label">학번/교번/사번</div>
            <div class="input-content">
              <label>
                <input type="text" v-model="state.memberCode" placeholder="학번/교번/사번을 입력하세요">
              </label>
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">이메일</div>
            <div class="input-content">
              <label>
                <input type="text" v-model="state.email" placeholder="이메일을 입력하세요" @keyup.enter="sendEmail" />
              </label>
            </div>
          </div>
        </div>
        <div class="btn-row g10">
          <button class="btn btn-default" @click="router.go(-1)"><font-awesome-icon icon="fa-solid fa-arrow-left" />
            돌아가기</button>
          <button @click="sendEmail" class="btn btn-submit" :disabled="isLoading">
            <font-awesome-icon v-if="isLoading" icon="fa-solid fa-spinner" spin />
            <font-awesome-icon v-else icon="fa-solid fa-paper-plane" />
            {{ isLoading ? '발송 중...' : '인증번호 발송' }}
          </button>
        </div>
      </div> <!-- step 1 -->


      <!-- 인증코드 입력 -->
      <div class="pw-content" v-if="step === 2">
        <div class="pw-title">
          <h2>{{ stepArray[1].title }}</h2>
          <p>{{ stepArray[1].content }}</p>
        </div>
        <div class="form-grid">
          <div class="input-wrap">
            <div class="input-content">
              <label>
                <input type="text" v-model="state.verifyCode"  @keyup.enter="checkCode">
              </label>
            </div>
          </div>
        </div>
        <div class="btn-row g10">
          <button @click="checkCode" class="btn btn-submit"><font-awesome-icon icon="fa-solid fa-check" /> 코드
            확인</button>
        </div>
      </div>

      <!-- 새 비밀번호 입력 -->
      <div class="pw-content" v-if="step === 3">
        <div class="pw-title">
          <h2>{{ stepArray[2].title }}</h2>
          <p>{{ stepArray[2].content }}</p>
        </div>
        <div class="form-grid">
          <div class="input-wrap">
            <div class="input-label">새 비밀번호</div>
            <div class="input-content">
              <label>
                <input :type="state.modeShowPw ? 'text' : 'password'" v-model="state.password"
                :class="{ 'input-error': state.errors.password }" @input="state.errors.password = false" autocomplete="off" @keyup.enter="resetPw" />
                <span @click="pwView" class="showPw" :class="!state.modeShowPw || 'show'"><font-awesome-icon
                    icon="fa-solid fa-eye" /></span>
              </label>
              <span v-if="state.errors.password" class="check-msg error-msg">새 비밀번호를 입력해주세요. </span>
              <span v-if="!state.password" class="check-msg">비밀번호는 영문자, 숫자, 특수기호가 각각 최소 하나 이상 포함하여 10글자 이상이어야합니다.</span>
              <PwCheckList :class="{ shake: isShake }" :password="state.password" ref="pwCheck" />
            </div>
          </div>
          <div class="input-wrap">
            <div class="input-label">새 비밀번호 확인</div>
            <div class="input-content">
              <label>
                <input :type="state.modeShowPw ? 'text' : 'password'" v-model="state.chkPw" placeholder="변경할 비밀번호를 다시 입력해주세요"
                  autocomplete="off" @keyup.enter="resetPw">
              </label>
              <span v-if="state.errors.chkPw" class="check-msg error-msg">비밀번호와 확인 비밀번호가 일치하지 않습니다 </span>
            </div>
          </div>
        </div>
        <div class="btn-row g10">
          <button @click="resetPw" class="btn btn-submit"><font-awesome-icon icon="fa-solid fa-circle-check" /> 비밀번호
            변경</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-wrap{max-width:550px;width: 100%; color: var(--font-color);}

.pw-step{display: grid;grid-template-columns: 1fr 1fr 1fr;text-align: center;padding: 20px;background:#fafafa;border-radius: 15px;}
.pw-step dl{display: grid;justify-content: center;text-align: center;gap: 5px; }
.pw-step dt{width: 30px;height: 30px;display: flex;justify-content: center;align-items:center;line-height: 1;border-radius: 50%;color:#fff;background-color:#ddd;align-self: center;justify-self: center;}
.pw-step dd{color:#ccc;font-weight: 600;}

.pw-step dl.active{opacity: 1;}
.pw-step dl.active dt{background-color: var(--main-color);border: 1px solid  var(--hover-bg-color);}
.pw-step dl.active dd{color: var(--main-color);}

.pw-title{text-align: center;display: grid;gap:5px;padding: 40px 0 10px;}
.pw-title h2{font-size: 1.6rem;font-weight: 500;}
.pw-title p{color: var(--font-color-light);}

.form-grid{row-gap: 20px;padding: 40px 20px 50px;}
.input-wrap{ grid-template-columns: 1fr; gap: 5px;}
.input-label{text-align-last: left;font-size: .9em;}

.input-content{position: relative;}
.input-content input{}
.showPw{position: absolute;right: 10px;top: 50%;transform: translateY(-50%);color: #ddd;cursor: pointer;}
.showPw.show{color: var(--font-color);}

.pwRule{display: block;margin-top: 3px;font-size: .9rem;color: #999;}

.btn.btn-submit:disabled { opacity: 0.6; cursor: default; }

.input-error { border-color: red !important; }
.check-msg {font-size: 0.9rem;color:#888;line-height: 1.2;display: block;margin-top: 4px;}
.check-msg.error-msg { color: red;}

.pw-check-list.point{}
</style>