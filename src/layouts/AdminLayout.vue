<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import LeftNav from '@/layouts/common/LeftNav.vue';
import TopLocation from '@/layouts/common/TopLocation.vue';
import PageTitle from '@/layouts/common/PageTitle.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import NotificationList from '@/views/academic/notification/NotificationList.vue';
import NotificationService from '@/services/notificationService';
const authStore = useAuthStore()
</script>
<template>
  <div :class="authStore.isLogin ? 'all-wrap' : 'intro'">
    <!-- 로그인 전 화면-->
    <section class="intro-banner" aria-hidden="true" v-if="!authStore.isLogin">
      <div class="intro-banner-content">
        <p class="sub">GREEN UNIVERSITY</p>
        <h1><b>관리자</b> 포털</h1>
      </div>
    </section>
    <!-- 로그인 후 화면-->
    <LeftNav v-if="authStore.isLogin" />
    <TopLocation v-if="authStore.isLogin" />
    <main :class="authStore.isLogin ? 'container' : 'intro-panel'">
      <PageTitle  v-if="authStore.isLogin" />
      <RouterView :key="$route.path" />
    </main>
  </div>

  <!-- 모달 -->
  <BaseModal />
  <Teleport to="body">
    <div v-if="NotificationService.isPanelOpen.value" class="noti-backdrop"
      @click.self="NotificationService.isPanelOpen.value = false">
      <div class="noti-panel">
        <NotificationList />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
// ---------- Layout ----------
.intro {
  min-height: 100vh;
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
    linear-gradient(120deg, rgba($admin-default-bg2, 0.90), rgba($admin-default-bg2, .80)),
    url(https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D) center/cover no-repeat;
  color: #fff;
  min-height: 300px;

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
  background: $admin-default-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 5px solid $green-600;
}

.noti-backdrop {
  position: fixed;
  inset: 0;
  left: 220px;
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
