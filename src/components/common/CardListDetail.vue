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
  <div class="cdl">
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
.cdl {
  display: flex; gap: 20px; align-items: flex-start;
  &-list { flex: 0 0 460px; display: flex; flex-direction: column; gap: 5px; }
  &-card { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border: 1px solid $border-color; border-radius: 6px; cursor: pointer; background: #fff;
  &:hover,
  &.active { background: $hover-bg-color; }
  }  
  &-empty { color: $font-color-light; font-size: 14px; text-align: center; padding: 40px 0;}
  &-footer { margin-top: 4px;}
  &-detail { flex: 1; position: relative; border: 1px solid #ddd; border-radius: 8px; padding: 20px; display: flex; flex-direction: column;  gap: 12px; background: #fff;}

  :slotted(.card-title){font-size: 1.1em;font-weight: 600;}
  :slotted(.card-detail){
    font-size: 0.9em;color: $font-color-light;
    span:not(:first-child){margin-left: 7px;padding-left: 7px;position: relative;
      &:before{content:'';width: 1px;height: 100%; position: absolute;left: 0;top: 0;background: #ccc;}
    }
  }
  :slotted(.badge){
    color: $font-color-light;font-size: 0.85em;
  }
}
</style>
