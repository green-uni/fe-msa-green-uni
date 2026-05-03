<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import LeftNav from '@/layouts/LeftNav.vue';
import TopHeader from '@/layouts/TopHeader.vue';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

</script>

<template>
  <div class="layout">
    <TopHeader v-if="authStore.isLogin" />
    <LeftNav v-if="authStore.isLogin" />
   <!-- 메인 컨텐츠 -->
    <main class="main-content">
      <RouterView />
    </main>

  </div>
</template>

<style lang="scss">

</style>
