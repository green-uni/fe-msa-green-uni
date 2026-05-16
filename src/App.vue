<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/authentication'
import NotificationService from '@/services/notificationService'

const authStore = useAuthStore()

watch(
  () => authStore.isLogin,
  (isLogin) => {
    if (isLogin) {
      NotificationService.connect(authStore.role)
    } else {
      NotificationService.disconnect()
    }
  },
  { immediate: true }
)
</script>

<template>
  <RouterView />
</template>

<style scoped lang="scss">

</style>
