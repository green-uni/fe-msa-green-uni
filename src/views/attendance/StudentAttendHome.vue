<template>
  <div class="attend-home">

    <!-- 상단 헤더: 학생 정보 -->
    <header class="s-header">
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

    <!-- 하단: 로그아웃 -->
    <footer class="bottom-bar">
      <button class="btn-logout" @click="doLogOut" aria-label="로그아웃">
        로그아웃
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
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
  padding: 0 0 20px;
  max-width: 480px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
}

/* ── 상단 헤더 ── */
.s-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: calc(env(safe-area-inset-top) + 14px) 16px 12px;
  border-bottom: 1px solid $border-color;
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
  margin: 0;
}

.header-user {
  font-size: 0.75rem;
  color: $font-color-light;
}

/* ── 하단 바: 로그아웃 ── */
.bottom-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 14px 16px calc(env(safe-area-inset-bottom) + 14px);
  border-top: 1px solid $border-color;
}

.btn-logout {
  background: none;
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 8px 20px;
  color: $font-color-light;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
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
  padding: 16px 16px;
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

</style>