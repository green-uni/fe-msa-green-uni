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
  showCount: { type: Boolean, default: false },
  count: { type: Number, default: 0 },
  showPageSize: { type: Boolean, default: false },
  pageSizeOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['search', 'reset', 'select', 'pageSizeChange'])
const searchQuery = defineModel('searchQuery', { default: '' })
const pageSize = defineModel('pageSize', { default: 10 })
</script>

<template>
  <div class="list-header">
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

    <div v-if="showCount || showPageSize" class="data-header">
      <span v-if="showCount" class="count-text">전체 <strong>{{ count }}</strong>건</span>
      <select v-if="showPageSize" v-model="pageSize" @change="emit('pageSizeChange')">
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}개</option>
      </select>
    </div>
  </div>
</template>

<style scoped lang="scss">
.list-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.filter-header { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid $border-color; padding: 8px 11px; border-radius: 7px; flex-wrap: wrap; gap: 5px; }
.filter-group { display: flex; gap: 15px; font-size: .95rem; }
.search-area {
  display: flex; gap: 5px; align-items: center;
  input { min-width: 180px; }
}
.search-btn { display: flex; align-items: center; gap: 4px; transition: 0.2s; background: $green-600; color: #fff; padding: 7px 15px; 
  &:hover { box-shadow: 0 0 5px $green-600; border-color: $green-600; filter: brightness(1.1);
}
}
.data-header {
  display: flex; justify-content: space-between; align-items:end;
  .count-text {
    color: #888;
    strong { color: $font-color-bold; font-weight: 700; }
  }
}

:slotted(.tab-area) { display: flex; gap: 4px; }
:slotted(.tab-area .filter-btn) { padding: 8px 20px; border: 1px solid #ddd; border-radius: 4px; background: #fff;  color: #555; cursor: pointer; transition: all 0.2s;}
:slotted(.tab-area .filter-btn.active) { background: $green-600; color: #fff; border-color: $green-600;}
:slotted(.tab-area .filter-btn:hover:not(.active)) { background: #f5f5f5; }
</style>
