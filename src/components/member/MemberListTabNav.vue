<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  activeTab: {
    type: String,
    required: true,
  },
})

const router = useRouter()
</script>

<template>
  <nav class="create-tab-nav">
    <button
      class="create-tab"
      :class="{ active: activeTab === 'students' }"
      @click="router.push('/admin/members/students')"
    >
        학생 목록 조회
    </button>
    <button
      class="create-tab"
      :class="{ active: activeTab === 'professors' }"
      @click="router.push('/admin/members/professors')"
    >
      교수 목록 조회
    </button>
    <button
      class="create-tab"
      :class="{ active: activeTab === 'admins' }"
      @click="router.push('/admin/members/admins')"
    >
      관리자 목록 조회
    </button>
  </nav>
</template>

<style scoped lang="scss">
.create-tab-nav {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  background: #fff;
}

.create-tab {
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
