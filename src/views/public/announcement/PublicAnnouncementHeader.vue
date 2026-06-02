<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="page-header">
    <h2 class="pub-title">그린 대학교 공지사항</h2>
    <button class="btn btn-line point" @click="router.push('/login')">처음으로</button>
  </div>
</template>

<style scoped lang="scss">
.pub-title { font-size: $fs-lg; font-weight: 700; color: $font-color-bold; border-left: 3px solid $green-600; padding-left: 10px; }
</style>
