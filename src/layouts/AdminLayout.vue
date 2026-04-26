<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}


const isActive = (path) => route.path.startsWith(path)

const navigate = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="layout admin-layout" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
    관리자페이지
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">

</style>
