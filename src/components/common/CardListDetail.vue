<script setup>
defineProps({
  items:        { type: Array,            default: () => [] },
  isLoading:    { type: Boolean,          default: false },
  selectedKey:  { type: [String, Number], default: null },
  itemKey:      { type: String,           default: 'id' },
  emptyMessage: { type: String,           default: '조회된 데이터가 없습니다.' },
})
defineEmits(['select'])
</script>

<template>
  <div class="cdl-layout">
    <!-- 왼쪽: 카드 목록 -->
    <div class="cdl-list">
      <p v-if="isLoading" class="cdl-empty">불러오는 중...</p>
      <template v-else-if="items.length">
        <div
          v-for="item in items"
          :key="item[itemKey]"
          class="cdl-card"
          :class="{ active: selectedKey === item[itemKey] }"
          @click="$emit('select', item)"
        >
          <slot name="card" :item="item" />
        </div>
      </template>
      <p v-else class="cdl-empty">{{ emptyMessage }}</p>
      <div v-if="$slots['list-footer']" class="cdl-footer">
        <slot name="list-footer" />
      </div>
    </div>
    <!-- 오른쪽: 상세 또는 안내 패널 -->
    <div v-if="selectedKey != null" class="cdl-detail">
      <slot name="detail" />
    </div>
    <div v-else-if="$slots['detail-empty']" class="cdl-detail">
      <slot name="detail-empty" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.cdl-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.cdl-list {
  flex: 0 0 460px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cdl-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;

  &:hover,
  &.active {
    background: var(--hover-bg-color, #f5f5f5);
  }
}

.cdl-empty {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
}

.cdl-footer {
  margin-top: 4px;
}

.cdl-detail {
  flex: 1;
  position: relative;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
}
</style>
