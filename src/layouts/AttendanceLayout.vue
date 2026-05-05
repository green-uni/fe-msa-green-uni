<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import TopHeader from '@/layouts/common/TopHeader.vue';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

</script>

<template>
  <div>
    <TopHeader />
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.top-header{background: #999;}
</style>
