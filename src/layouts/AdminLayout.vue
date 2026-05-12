<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authentication';
import LeftNav from '@/layouts/common/LeftNav.vue';
import TopHeader from '@/layouts/common/TopHeader.vue';
import BaseModal from '@/components/common/BaseModal.vue';

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

</script>

<template>
  <div :class="authStore.isLogin ? 'all-wrap' : 'log-in'">
    <TopHeader v-if="authStore.isLogin" />
    <LeftNav v-if="authStore.isLogin" />
    <main class="container">
      <RouterView />
    </main>
  </div>
  <BaseModal/>
</template>

<style scoped lang="scss">
.all-wrap .container {
  background: #f3f3f3;
}
</style>
