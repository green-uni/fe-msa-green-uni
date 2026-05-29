<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { routes } from '@/router/routes'

const route = useRoute()
const router = useRouter()
const isAdmin = route.path.startsWith('/admin')
const prefix = isAdmin ? '/admin/' : '/'

const rootPath = computed(() =>
  route.meta?.activeMenu ?? route.path.replace(prefix, '')
)

const tabs = computed(() => {
  const flatRoutes = routes
    .filter(r => r.path === (isAdmin ? '/admin/' : '/'))
    .flatMap(r => r.children || [])

  const rootRoute = flatRoutes.find(r => r.path === rootPath.value)
  if (!rootRoute?.meta?.navTitle) return []

  return flatRoutes
    .filter(r => (r.path === rootPath.value || r.meta?.activeMenu === rootPath.value) && r.meta?.navTitle)
    .map(r => ({
      title: r.meta?.title,
      path: prefix + r.path,
    }))
})
</script>

<template>
  <nav class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.path"
      class="tab"
      :class="{ active: route.path === tab.path }"
      @click="router.push(tab.path)"
    >
      {{ tab.title }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.tab-nav { display: inline-flex; border: 1px solid $border-color;  border-radius: 7px; overflow: hidden;  margin-bottom: 12px;}
.tab { 
  padding: 10px 18px; font-weight: 500;background: #fff; border: none;  border-left: 1px solid $border-color;  cursor: pointer;  color: $font-color-light;  transition: color 0.15s, background 0.15s;  white-space: nowrap;
  &:first-child { border-left: none; }
  &:hover:not(.active) { background: $default-hover-bg-color; color: $font-color; }
  &.active { background: $green-600; color: #fff; font-weight: 600; }
}
</style>
