<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import LeftNav from '@/layouts/common/LeftNav.vue';
import TopLocation from '@/layouts/common/TopLocation.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import PageTitle from '@/layouts/common/PageTitle.vue';
import NotificationList from '@/views/academic/notification/NotificationList.vue';
import NotificationService from '@/services/notificationService';

const authStore = useAuthStore()
const route = useRoute()

// [유지] 모바일에서 공개 페이지(/login 등) 접근 시 사이드바·헤더 숨김
// 이전 세션이 남아 isLogin=true인 상태로 /login 접근하면 사이드바가 뜨는 문제 방지
const publicRoutes = ['/login', '/admin/login', '/auth/password']
const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
const showLayout = computed(() =>
  authStore.isLogin && !(isMobileDevice && publicRoutes.includes(route.path))
)
</script>
<template>
  <div :class="showLayout ? 'all-wrap' : 'intro'">
    <!-- 로그인 전 왼쪽 배너 -->
    <section class="intro-banner" aria-hidden="true" v-if="!showLayout">
      <div class="intro-banner-content">
        <p class="sub">GREEN UNIVERSITY · 통합 학사시스템</p>
        <h1>너와 나의 꿈을<br />그린(GREEN) 캠퍼스</h1>
      </div>
    </section>
    <!-- 로그인 후 화면-->
    <LeftNav v-if="showLayout" />
    <TopLocation v-if="showLayout" />
    <main :class="showLayout ? 'container' : 'intro-panel'">
      <PageTitle v-if="showLayout" />
      <RouterView />
    </main>
  </div>

  <!-- 모달 -->
  <BaseModal />

  <!-- 알림 사이드 패널 -->
  <Teleport to="body">
    <div v-if="NotificationService.isPanelOpen.value" class="noti-backdrop"
      @click.self="NotificationService.isPanelOpen.value = false">
      <div class="noti-panel">
        <NotificationList />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
// ---------- Layout ----------
.intro {
  min-height: 100vh;
  min-height: 100dvh; // 모던 브라우저: 주소창 높이 제외한 실제 화면 높이
  display: grid;
  grid-template-columns: 1fr 1.5fr;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}

// ---------- LEFT : Banner ----------
.intro-banner {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(120deg, rgba($green-600, 0.25), rgba($green-600, .85)),
    url(https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D) center/cover no-repeat;
  color: #fff;
  min-height: 300px;

  // 모바일: 배너 숨김 → 로그인 패널이 전체 화면을 차지
  @media (max-width: 960px) {
    display: none;
  }

  &-content {
    position: relative;
    padding: 8%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 14px;

    .sub {
      font-size: .9em;
      letter-spacing: .18em;
      text-transform: uppercase;
      opacity: .85;
      margin: 0;
    }

    h1 {
      font-size: 4em;
      line-height: 1.15;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.02em;
    }
  }
}

// ---------- RIGHT : Panel ----------
.intro-panel {
  background: $default-bg;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 960px) {
    // 배너가 없으므로 전체 화면 차지
    min-height: 100vh;       // 구형 Android fallback
    min-height: 100dvh;      // 모던 브라우저: 주소창 포함 실제 가용 높이
    // 콘텐츠가 화면보다 길면 위에서부터 표시
    align-items: flex-start;
    // iOS 노치(상단) · 홈바(하단) safe area 여백 — Android는 값이 0이라 무해
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

// ---------- noti ----------
.noti-backdrop {
  position: fixed;
  inset: 0;
  left: 220px; // 사이드바 제외하고 시작
  z-index: 900;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-start;
}

.noti-panel {
  width: 33.33vw;
  min-width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
</style>