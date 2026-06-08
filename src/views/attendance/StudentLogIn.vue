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
  } finally {
    isLoading.value = false
  }
}

// ── PWA 설치 유도 ──────────────────────────────────────────────
const isInstalledPwa = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true

const isIos     = /iPhone|iPad|iPod/i.test(navigator.userAgent)
const isAndroid = /Android/i.test(navigator.userAgent)

const deferredPrompt = ref(null)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
})

async function installPwa() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  deferredPrompt.value = null
}
</script>

<template>
  <div class="student-login">

    <div class="login-content">
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

    <!-- PWA 설치 유도 (미설치 상태에서만 표시) -->
    <div v-if="!isInstalledPwa" class="install-guide">
      <p class="install-guide-title">📲 홈 화면에 추가하면 더 편리해요</p>

      <template v-if="isAndroid && deferredPrompt">
        <button class="btn-install" @click="installPwa">홈화면에 추가하기</button>
      </template>

      <template v-else-if="isAndroid">
        <p class="install-guide-step">
          Chrome 우측 상단 <strong>⋮ 메뉴</strong> → <strong>홈 화면에 추가</strong>
        </p>
      </template>

      <template v-else-if="isIos">
        <p class="install-guide-step">
          Safari 하단 <strong>공유(□↑)</strong> → <strong>홈 화면에 추가</strong>
        </p>
      </template>

      <template v-else>
        <p class="install-guide-step">브라우저 메뉴 → <strong>홈 화면에 추가</strong></p>
      </template>
    </div>

  </div>
</template>

<style scoped lang="scss">
.student-login {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $default-bg;
  padding: 0 24px 32px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  gap: 24px;
}

.login-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  padding-top: env(safe-area-inset-top, 44px);
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
    background: $green-600;
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
    color: $font-color;
    margin: 0;
  }

  &__sub {
    margin: 0;
    font-size: 0.875rem;
    color: $font-color-light;
    padding-left: 2px;
  }
}

.form-card {
  background: #fff;
  border-radius: $radius-df;
  padding: 28px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── PWA 설치 유도 ── */
.install-guide {
  background: #fff;
  border: 1.5px solid $green-600;
  border-radius: $radius-sm;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.install-guide-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: $font-color;
}

.install-guide-step {
  font-size: 0.75rem;
  color: $font-color-light;
  line-height: 1.6;
  strong { color: $font-color; }
}

.btn-install {
  width: 100%;
  padding: 10px 0;
  background: $green-600;
  color: #fff;
  border: none;
  border-radius: $radius-sm;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
}
</style>