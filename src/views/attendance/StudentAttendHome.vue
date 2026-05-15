<template>
  <div class="attend-home">

    <!-- ── PWA 미설치 안내 (브라우저로 접속한 경우만 표시) ── -->
    <div v-if="showInstallGuide" class="install-guide">
      <div class="install-guide-inner">
        <p class="install-guide-title">📲 앱으로 설치하면 더 편리해요</p>

        <!-- Android: beforeinstallprompt 이벤트 지원 -->
        <template v-if="isAndroid && deferredPrompt">
          <button class="btn-install-main" @click="installPwa">홈화면에 추가하기</button>
        </template>

        <!-- iOS: 수동 설치 안내 -->
        <template v-else-if="isIos">
          <p class="install-guide-step">
            Safari 하단 <strong>공유 버튼(□↑)</strong> →
            <strong>홈 화면에 추가</strong> 탭
          </p>
        </template>

        <!-- 그 외 (Android인데 이벤트 아직 안 온 경우 등) -->
        <template v-else>
          <p class="install-guide-step">브라우저 메뉴 → <strong>홈 화면에 추가</strong></p>
        </template>

        <button class="btn-dismiss-guide" @click="showInstallGuide = false">나중에</button>
      </div>
    </div>

    <!-- 헤더 -->
    <header class="header">
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
    </header>

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
        <p class="card-main-subtitle">전체 출석 기록 확인</p>
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
      </div>

    </main>

    <!-- 하단 안내 -->
    <footer class="footer-notice">
      <p class="footer-notice-text">학교 와이파이 연결 시에만 출석 가능</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authentication'

const router    = useRouter()
const authStore = useAuthStore()

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
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--default-bg);
  padding: 20px 16px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ── PWA 설치 안내 배너 ── */
.install-guide {
  background: #fff;
  border: 1.5px solid var(--main-color);
  border-radius: var(--bdrs-sm);
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
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--font-color);
}

.install-guide-step {
  font-size: var(--text-xs);
  color: var(--font-color-light);
  line-height: 1.6;
  strong { color: var(--font-color); }
}

.btn-install-main {
  width: 100%;
  padding: 10px 0;
  background: var(--main-color);
  color: #fff;
  border: none;
  border-radius: var(--bdrs-sm);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
}

.btn-dismiss-guide {
  align-self: flex-end;
  background: none;
  border: none;
  font-size: var(--text-xs);
  color: var(--font-color-light);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

/* ── 헤더 ── */
.header {
  flex-shrink: 0;
  text-align: center;
  padding-top: 8px;
}

.header-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.header-logo {
  width: 22px;
  height: 22px;
  background: var(--main-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.header-school {
  font-size: 15px;
  font-weight: 600;
  color: var(--font-color);
}

.header-user {
  font-size: var(--text-xs);
  color: var(--font-color-light);
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
  background: var(--main-color);
  border-radius: var(--bdrs-df);
  padding: 24px 16px;
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
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 24px;
  background: white;
  border: 1px solid var(--line-color);
  border-radius: var(--bdrs-df);
  cursor: pointer;
  color: var(--main-color);
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover  { background: var(--hover-bg-color); border-color: var(--main-color); }
  &:active { transform: scale(0.96); }
}

.card-qr-icon { width: 56px; height: 56px; margin-bottom: 8px; }
.card-qr-text { font-size: 13px; font-weight: 600; color: var(--main-color); }

/* ── 하단 안내 ── */
.footer-notice      { flex-shrink: 0; text-align: center; padding-bottom: 4px; }
.footer-notice-text { font-size: 11px; color: var(--font-color-light); }
</style>