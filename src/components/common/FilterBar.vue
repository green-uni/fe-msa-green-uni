<script setup>
import SearchInput from '@/components/util/SearchInput.vue'

defineProps({
  hasFilter: Boolean,
  placeholder: { type: String, default: '이름 검색' },
  showSearch: { type: Boolean, default: true },
  // 'input'(기본 plain input) | 'search-input'(자동완성 SearchInput)
  searchType: { type: String, default: 'input' },
  // searchType === 'search-input' 일 때 SearchInput에 전달되는 props
  searchList: { type: Array, default: () => [] },
  searchLabelKey: { type: String, default: 'name' },
  searchValueKey: { type: String, default: 'id' },
  searchShowOnFocus: { type: Boolean, default: false },
})
const emit = defineEmits(['search', 'reset', 'select'])
const searchQuery = defineModel('searchQuery', { default: '' })
</script>

<template>
  <div class="filter-header">
    <div class="filter-group">
      <slot />
      <button v-if="hasFilter" class="btn" @click="emit('reset')">초기화</button>
    </div>
    <div v-if="showSearch" class="search-area">
      <template v-if="searchType === 'search-input'">
        <SearchInput
          v-model="searchQuery"
          :list="searchList"
          :labelKey="searchLabelKey"
          :valueKey="searchValueKey"
          :placeholder="placeholder"
          :showOnFocus="searchShowOnFocus"
          @enter="emit('search')"
          @select="(item) => emit('select', item)"
        />
      </template>
      <template v-else>
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
      </template>
    </div>
  </div>
</template>
