<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import TopHeader from '@/layouts/common/TopHeader.vue';

const route = useRoute()

// [추가] /student/attendances/** 진입 시 body에 pwa-view 클래스 추가
// → _base.scss의 #app { overflow: hidden } 을 해제하여 PWA 페이지 스크롤 허용
onMounted(() => document.body.classList.add('pwa-view'))
onUnmounted(() => document.body.classList.remove('pwa-view'))
</script>

<template>
  <div class="pwa-wrap">
    <!-- [수정] 홈 화면(/home)은 자체 헤더를 가지므로 TopHeader 숨김 -->
    <TopHeader v-if="!route.path.endsWith('/home')" :mobile="true" />
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.pwa-wrap {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--default-bg);
}
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
