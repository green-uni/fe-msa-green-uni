<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import { useModalStore } from '@/stores/modal'
import AuthService from '@/services/authService'
import MemberService from '@/services/memberService'
import LoginForm from '@/components/auth/LoginForm.vue'

const router    = useRouter()
const authStore = useAuthStore()
const modal     = useModalStore()
const isLoading = ref(false)

const form = ref({ memberCode: '20221001', password: '1234' })

const login = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    const res     = await AuthService.logIn(form.value)
    const profile = await MemberService.findProfile()
    authStore.logIn(res.data)
    authStore.setProfile(profile.data)

    if (res.data.isFirstLogin) {
      await modal.showAlert('최초 로그인입니다. PC에서 비밀번호를 변경해 주세요.', 'warning')
      router.push('/student/attendances/home')
      return
    }

    const redirect = sessionStorage.getItem('redirectAfterLogin')
    if (redirect) {
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirect)
      return
    }

    router.push('/student/attendances/home')
  } catch (e) {
    console.error(e)
    isLoading.value = false
  }
}
</script>

<template>
  <div class="student-login">

    <header class="s-header">
      <div class="s-header__title">
        <span class="s-header__logo">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 9L12 5 2 9l10 4 10-4v6"/>
            <path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4"/>
          </svg>
        </span>
        <p class="s-header__name">그린대학교 전자출결</p>
      </div>
      <p class="s-header__sub">학생 출석 관리 시스템</p>
    </header>

    <div class="form-card">
      <LoginForm :form="form" variant="academic" :mobile="true" :isLoading="isLoading" @login="login" />
    </div>

  </div>
</template>

<style scoped lang="scss">
.student-login {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--default-bg);
  padding: 52px 24px 32px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  gap: 32px;
}

.s-header {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  &__logo {
    width: 26px;
    height: 26px;
    background: var(--main-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  &__name {
    font-size: 17px;
    font-weight: 700;
    color: var(--font-color);
    margin: 0;
  }

  &__sub {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--font-color-light);
    padding-left: 2px;
  }
}

.form-card {
  background: #fff;
  border-radius: var(--bdrs-df);
  padding: 28px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    margin: 0;
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--font-color);
  }
}
</style>
