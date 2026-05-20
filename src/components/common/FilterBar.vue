<script setup>
defineProps({
  hasFilter: Boolean,
  placeholder: { type: String, default: '이름 검색' },
})
const emit = defineEmits(['search', 'reset'])
const searchQuery = defineModel('searchQuery', { default: '' })
</script>

<template>
  <div class="filter-header">
    <div class="filter-group">
      <slot />
      <button v-if="hasFilter" class="btn" @click="emit('reset')">초기화</button>
    </div>
    <div class="search-area">
      <div class="input-content">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          @keyup.enter="emit('search')"
        />
      </div>
      <button class="btn search-btn" @click="emit('search')">
        <font-awesome-icon icon="fa-solid fa-magnifying-glass" /> 검색
      </button>
    </div>
  </div>
</template>
