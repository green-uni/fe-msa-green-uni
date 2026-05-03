<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import LeftNav from '@/layouts/LeftNav.vue';
import TopHeader from '@/layouts/TopHeader.vue';

const router = useRouter()
const route = useRoute()

</script>

<template>
  <div class="layout">
  <TopHeader />
  <LeftNav />
   <!-- 메인 컨텐츠 -->
    <main class="main-content">
      <RouterView />
    </main>

  </div>
</template>

<style lang="scss">
.layout{
  &.academic {
    display: grid; grid-template-columns: 250px 1fr;
  }
}
</style>
