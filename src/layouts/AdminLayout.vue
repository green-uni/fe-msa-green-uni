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
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">

</style>
