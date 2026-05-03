<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style scoped lang="scss">
.all-wrap {
  display: grid; grid-template-columns: 220px 1fr; grid-template-rows: 40px 1fr; height: 100vh; width: 100vw; color: var(--font-color);
  .container{padding:50px 60px 120px; border-top-left-radius: 30px; overflow-y: auto; min-width:1024px;}
}
</style>
