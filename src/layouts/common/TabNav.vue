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
.tab-nav {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  background: #fff;
}

.tab {
  flex: 1;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color 0.2s, border-color 0.2s;

  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }
}
</style>
