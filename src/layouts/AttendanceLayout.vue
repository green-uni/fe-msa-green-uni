<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import TopHeader from '@/layouts/common/TopHeader.vue';

const authStore = useAuthStore()
</script>

<template>
  <div>
    <TopHeader />    
    <div class="mobile-user-box">
        <p>
          <span>{{ authStore.memberCode }}</span>
          <span>{{ authStore.major }}</span>
          <span>{{ authStore.name }}</span>
        </p>
    </div>
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.top-header{background: #999;}
</style>
