<template>
  <div class="attend-home">

    <!-- 메인 영역 -->
    <main class="main-area">

      <!-- 큰 카드: 나의 출석 현황 -->
      <button
        type="button"
        class="card-main"
        aria-label="나의 출석 현황 페이지로 이동"
        @click="goToMyAttend"
      >
        <span class="card-main-icon">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <polyline points="17 11 19 13 23 9"/>
          </svg>
        </span>
        <p class="card-main-title">나의 출석 현황</p>
      </button>

      <!-- 작은 카드: QR 출석하기 -->
      <div class="card-qr-wrapper">
        <button
          type="button"
          class="card-qr"
          aria-label="QR 출석 페이지로 이동"
          @click="goToQrScan"
        >
          <span class="card-qr-icon">
            <svg viewBox="0 0 64 64" width="100%" height="100%">
              <path d="M 4 18 L 4 4 L 18 4"    fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <path d="M 46 4 L 60 4 L 60 18"  fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <path d="M 60 46 L 60 60 L 46 60" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              <path d="M 18 60 L 4 60 L 4 46"  fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </span>
          <p class="card-qr-text">QR 출석하기</p>
        </button>
        <!-- QR 버튼 바로 아래 안내 문구 -->
        <p class="wifi-notice">학교 와이파이 연결 시에만 출석 가능</p>
      </div>

    </main>

    <!-- 하단: 학생 정보 + 로그아웃 -->
    <footer class="bottom-bar">
      <div class="header-left">
        <div class="header-title">
          <span class="header-logo">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 9L12 5 2 9l10 4 10-4v6"/>
              <path d="M6 10.6V16a6 3 0 0 0 12 0v-5.4"/>
            </svg>
          </span>
          <p class="header-school">그린대학교 전자출결</p>
        </div>
        <p class="header-user">{{ majorName }} · {{ userName }}</p>
      </div>
      <button class="btn-logout" @click="doLogOut" aria-label="로그아웃">로그아웃
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'
import AuthService from '@/services/authService'

const router    = useRouter()
const authStore = useAuthStore()

async function doLogOut() {
  try {
    await AuthService.logOut()
    authStore.logOut()
    router.push('/login')
  } catch (e) {
    console.error(e)
  }
}

const majorName = computed(() => authStore.major || '-')
const userName  = computed(() => authStore.name  || '-')

// ── PWA 설치 감지 ──────────────────────────────────────────────────────────────
// standalone: 이미 PWA로 설치되어 실행 중인 경우 → 설치 안내 불필요
const isInstalledPwa = window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true  // iOS Safari PWA 감지

const isIos     = /iPhone|iPad|iPod/i.test(navigator.userAgent)
const isAndroid = /Android/i.test(navigator.userAgent)

// 설치 안내: 미설치 상태에서만 표시
const showInstallGuide = ref(!isInstalledPwa)

// ── Android: beforeinstallprompt 이벤트 (Chrome 전용) ────────────────────────
let deferredPrompt = ref(null)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
})

async function installPwa() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') showInstallGuide.value = false
  deferredPrompt.value = null
}

// ── 이벤트 핸들러 ──────────────────────────────────────────────────────────────
function goToMyAttend() { router.push('/student/attendances/my') }
function goToQrScan()   { router.push('/student/attendances/scan') }
</script>

<style scoped lang="scss">
.attend-home {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $default-bg;
  padding: calc(env(safe-area-inset-top) + 20px) 16px 20px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── PWA 설치 안내 배너 ── */
.install-guide {
  background: #fff;
  border: 1.5px solid $green-600;
  border-radius: $radius-sm;
  margin-bottom: 16px;
  overflow: hidden;
}

.install-guide-inner {
  padding: 14px 16px;
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

.btn-install-main {
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

.btn-dismiss-guide {
  align-self: flex-end;
  background: none;
  border: none;
  font-size: 0.75rem;
  color: $font-color-light;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

/* ── 헤더 ── */
.header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 8px;
}

.header-left { display: flex; flex-direction: column; gap: 4px; }

.btn-logout {
  background: none;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 6px 10px;
  color: $font-color-light;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  flex-shrink: 0;
  &:hover { color: $font-color; border-color: $font-color-light; }
  &:active { opacity: 0.7; }
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.header-logo {
  width: 22px;
  height: 22px;
  background: $green-600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-school {
  font-size: 15px;
  font-weight: 600;
  color: $font-color;
}

.header-user {
  font-size: 0.75rem;
  color: $font-color-light;
}

.btn-logout {
  background: none;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 6px 8px;
  color: $font-color-light;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  &:hover { color: $font-color; border-color: $font-color-light; }
  &:active { opacity: 0.7; }
}

/* ── 메인 영역 ── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
}

/* ── 큰 카드 ── */
.card-main {
  background: $green-600;
  border-radius: $radius-df;
  padding: 24px 16px;
  justify-content: center;
  text-align: center;
  box-shadow: 0 4px 14px rgba(62, 158, 126, 0.25);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
  width: 100%;

  &:hover  { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(62, 158, 126, 0.3); }
  &:active { transform: scale(0.98); }
}

.card-main-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-main-title    { font-size: 17px; font-weight: 600; color: white; margin-bottom: 4px; }
.card-main-subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.85); }

/* ── 작은 카드 ── */
.card-qr-wrapper { text-align: center; }

.card-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px 16px;
  background: white;
  border: 1px solid $border-color;
  border-radius: $radius-df;
  cursor: pointer;
  color: $green-600;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover  { background: $hover-bg-color; border-color: $green-600; }
  &:active { transform: scale(0.96); }
}

.card-qr-icon { width: 56px; height: 56px; margin-bottom: 8px; }
.card-qr-text { font-size: 13px; font-weight: 600; color: $green-600; }

/* ── QR 버튼 아래 와이파이 안내 ── */
.wifi-notice {
  font-size: 12px;
  color: $font-color-light;
  text-align: center;
  margin-top: 8px;
}

/* ── 하단 바: 학생 정보 + 로그아웃 ── */
.bottom-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0 4px;
  border-top: 1px solid $border-color;
  margin-top: 8px;
}
</style>