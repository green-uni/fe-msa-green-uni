<script setup>
import { useAuthStore } from '@/stores/authentication';
import { useRouter } from 'vue-router';
import { reactive, ref } from 'vue';
import { useModalStore } from '@/stores/modal'
import memberService from '@/services/memberService';
import PwCheckList from '@/components/util/PwCheckList.vue';

const authStore = useAuthStore()
const router = useRouter();
const modal = useModalStore()
const pwCheck = ref(null)

const isShake = ref(false)
const triggerShake = () => {// 강조용 흔들기 효과
  isShake.value = true
  setTimeout(() => { isShake.value = false }, 400)
}

const state = reactive({
  data: {
    oldPassword: '',
    newPassword: ''
  },
  chkPw: '',
  errors: { // 유효성 및 체크용
    oldPassword: false,
    newPassword: false,
    checks: false,
    chkPw: false
  }
});
const pwView = () => { state.modeShowPw = !state.modeShowPw }
const oldPwView = () => { state.modeShowOldPw = !state.modeShowOldPw }

const submit = async () => {
  // 기존 비밀번호
  if (!state.data.oldPassword) {
    state.errors.oldPassword = true
    return
  }
  // 새 비밀번호
  if (!state.data.newPassword) {
    state.errors.newPassword = true
    return
  }
  // 유효성 체크
  const checks = pwCheck.value?.checks
    if (!checks?.minLength || !checks?.letter || !checks?.number || !checks?.special) {
      triggerShake()
      return
    }
  // 비밀번호 확인
  if (state.chkPw !== state.data.newPassword) {
    state.errors.chkPw = true
    return
  }
  try {
    const res = await memberService.changePw(state.data)
    await modal.showAlert(res.message, 'success')
    router.push('/member/my')
  } catch (e) { console.error(e) }
}
</script>

<template>
  <div class="container">
    <div class="content-wrap">
      <div class="form-grid">
        <div class="input-wrap">
          <div class="input-label">기존 비밀번호</div>
          <div class="input-content">
            <label>
              <input :type="state.modeShowOldPw ? 'text' : 'password'"  v-model="state.data.oldPassword" :class="{ 'input-error': state.errors.oldPassword }"   @input="state.errors.oldPassword = false"  placeholder="기존 비밀번호를 입력해주세요" >
              <span @click="oldPwView" class="showPw" :class="!state.modeShowOldPw || 'show'"><font-awesome-icon
                icon="fa-solid fa-eye" /></span>
            </label>
            <span v-if="state.errors.oldPassword" class="check-msg error-msg"> 기존 비밀번호를 입력해주세요. </span>
          </div>
        </div>
        <div class="input-wrap">
          <div class="input-label">새 비밀번호</div>
          <div class="input-content">
            <label>
              <input :type="state.modeShowPw ? 'text' : 'password'"
                v-model="state.data.newPassword"
                :class="{ 'input-error': state.errors.newPassword }"
                @input="state.errors.newPassword = false"
                placeholder="변경할 비밀번호를 입력해주세요"
                autocomplete="off" />
              <span @click="pwView" class="showPw" :class="!state.modeShowPw || 'show'"><font-awesome-icon
                icon="fa-solid fa-eye" /></span>
            </label>
            <span v-if="state.errors.newPassword" class="check-msg error-msg">새 비밀번호를 입력해주세요. </span>
            <span v-if="!state.data.newPassword" class="check-msg">비밀번호는 영문자, 숫자, 특수기호가 각각 최소 하나 이상 포함하여 10글자 이상이어야합니다.</span>
            <PwCheckList :class="{ shake: isShake }" :password="state.data.newPassword" ref="pwCheck" />
          </div>
        </div>
        <div class="input-wrap">
          <div class="input-label">새 비밀번호 확인</div>
          <div class="input-content">
            <label>
              <input :type="state.modeShowPw ? 'text' : 'password'"
                :class="{ 'input-error': state.errors.chkPw }"
                v-model="state.chkPw" placeholder="변경할 비밀번호를 다시 입력해주세요" autocomplete="off">
            </label>
            <span v-if="state.errors.chkPw" class="check-msg error-msg">비밀번호와 확인 비밀번호가 일치하지 않습니다 </span>
          </div>
        </div>

      </div>
      <div class="btn-row g10">
        <!-- <button class="btn btn-default" @click="router.go(-1)"><font-awesome-icon icon="fa-solid fa-arrow-left" />
          돌아가기</button> -->
        <button @click="submit" class="btn btn-submit"><font-awesome-icon icon="fa-solid fa-circle-check" /> 비밀번호
          변경</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>